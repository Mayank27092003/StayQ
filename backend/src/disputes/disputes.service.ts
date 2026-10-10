import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DisputeReason } from '@prisma/client';
import { EarningsService } from '../earnings/earnings.service';
import { PaymentsService } from '../payments/payments.service';
import { text, money } from '../common/utils/input.util';
const admin = (u: any) =>
  u?.isAdmin && ['SUPER_ADMIN', 'TRUST_SAFETY'].includes(u.adminRole);
@Injectable()
export class DisputesService {
  constructor(
    private prisma: PrismaService,
    private earnings: EarningsService,
    @Inject(forwardRef(() => PaymentsService))
    private payments: PaymentsService,
  ) {}
  async raiseDispute(dto: any) {
    const reason = dto.reason;
    if (!Object.values(DisputeReason).includes(reason))
      throw new BadRequestException('Invalid dispute reason');
    const description = text(dto.description, 'Description', 8000);
    const evidence = dto.evidence || [];
    if (
      !Array.isArray(evidence) ||
      evidence.length > 20 ||
      evidence.some(
        (u) =>
          typeof u !== 'string' || u.length > 2048 || !/^https:\/\//.test(u),
      )
    )
      throw new BadRequestException('Invalid evidence');
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Booking" WHERE id=${dto.bookingId} FOR UPDATE`;
      const b = await tx.booking.findUnique({
        where: { id: dto.bookingId },
        include: { property: true, payment: true },
      });
      if (!b) throw new NotFoundException('Booking not found');
      if (b.guestId !== dto.raisedBy && b.property.hostId !== dto.raisedBy)
        throw new ForbiddenException('Booking participant required');
      if (
        !['CONFIRMED', 'COMPLETED'].includes(b.status) ||
        !['CAPTURED', 'RELEASED'].includes(b.payment?.status || '')
      )
        throw new ConflictException(
          'A paid confirmed or completed booking is required',
        );
      if (await tx.dispute.findUnique({ where: { bookingId: b.id } }))
        throw new ConflictException('A dispute already exists');
      const d = await tx.dispute.create({
        data: {
          bookingId: b.id,
          raisedBy: dto.raisedBy,
          reason,
          description,
          evidence,
        },
      });
      await tx.hostEarning.updateMany({
        where: { bookingId: b.id, payoutStatus: { not: 'COMPLETED' } },
        data: { payoutStatus: 'ON_HOLD' },
      });
      await tx.hostEarning.updateMany({
        where: { bookingId: b.id, payoutStatus: 'COMPLETED' },
        data: { recoveryRequired: true },
      });
      return d;
    });
  }
  async get(id: string, user: any) {
    const d = await this.prisma.dispute.findUnique({
      where: { id },
      include: {
        booking: { include: { property: { select: { hostId: true } } } },
      },
    });
    if (!d) throw new NotFoundException('Dispute not found');
    if (
      !admin(user) &&
      d.booking.guestId !== user?.id &&
      d.booking.property.hostId !== user?.id
    )
      throw new ForbiddenException('Dispute participant required');
    return d;
  }
  async resolveDispute(id: string, dto: any, user?: any) {
    if (!admin(user))
      throw new ForbiddenException('Trust and safety administrator required');
    if (
      ![
        'UNDER_REVIEW',
        'RESOLVED_GUEST_FAVOUR',
        'RESOLVED_HOST_FAVOUR',
        'CLOSED',
      ].includes(dto.status)
    )
      throw new BadRequestException('Invalid resolution');
    const note = text(dto.resolution, 'Resolution note', 4000);
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.dispute.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Dispute not found');
      await tx.$queryRaw`SELECT id FROM "Booking" WHERE id=${existing.bookingId} FOR UPDATE`;
      const d = await tx.dispute.findUnique({
        where: { id },
        include: {
          booking: { include: { payment: { include: { refunds: true } } } },
        },
      });
      if (!d) throw new NotFoundException('Dispute not found');
      if (d.requestedResolution) {
        if (
          d.requestedResolution !== dto.status ||
          (dto.refundAmount !== undefined &&
            Number(d.requestedRefundAmount) !== Number(dto.refundAmount))
        )
          throw new ConflictException(
            'A financial resolution is already pending',
          );
        return d;
      }
      if (
        ['RESOLVED_GUEST_FAVOUR', 'RESOLVED_HOST_FAVOUR', 'CLOSED'].includes(
          d.status,
        )
      )
        throw new ConflictException('Dispute is already resolved');
      if (dto.status === 'CLOSED')
        throw new BadRequestException(
          "Resolve the dispute in a party's favour before closing it",
        );
      let amount: number | undefined;
      if (dto.status === 'RESOLVED_GUEST_FAVOUR') {
        const p = d.booking.payment;
        if (!p?.razorpayOrderId || !['CAPTURED', 'RELEASED'].includes(p.status))
          throw new ConflictException('Refundable captured payment required');
        const reserved = p.refunds
          .filter((r) => !['FAILED', 'CANCELLED'].includes(r.status))
          .reduce((n, r) => n + Math.round(Number(r.amount) * 100), 0);
        const left = (Math.round(Number(p.amount) * 100) - reserved) / 100;
        amount = money(dto.refundAmount ?? left, 'Refund amount');
        if (amount > left)
          throw new BadRequestException(
            'Refund exceeds the available payment balance',
          );
      }
      const updated = await tx.dispute.update({
        where: { id },
        data: amount
          ? {
              status: 'UNDER_REVIEW',
              requestedResolution: dto.status,
              requestedRefundAmount: amount,
              resolution: note,
              resolvedBy: user.id,
            }
          : {
              status: dto.status,
              resolution: note,
              resolvedBy: user.id,
              resolvedAt: dto.status === 'UNDER_REVIEW' ? null : new Date(),
            },
      });
      if (amount)
        await tx.domainJob.upsert({
          where: { key: 'dispute-refund:' + id },
          create: {
            key: 'dispute-refund:' + id,
            type: 'DISPUTE_RESOLUTION',
            referenceId: id,
          },
          update: {},
        });
      else if (dto.status === 'RESOLVED_HOST_FAVOUR')
        await tx.hostEarning.updateMany({
          where: { bookingId: d.bookingId, payoutStatus: 'ON_HOLD' },
          data: { payoutStatus: 'PENDING', recoveryRequired: false },
        });
      await tx.adminAuditLog.create({
        data: {
          adminId: user.id,
          action: 'DISPUTE_RESOLUTION_REQUEST',
          targetType: 'DISPUTE',
          targetId: id,
          details: { status: dto.status, refundAmount: amount || null, note },
        },
      });
      return { ...updated, refundPending: !!amount };
    });
  }
  async processResolution(id: string) {
    const d = await this.prisma.dispute.findUnique({
      where: { id },
      include: { booking: { include: { payment: true } } },
    });
    if (!d || d.status === 'RESOLVED_GUEST_FAVOUR') return;
    if (
      d.requestedResolution !== 'RESOLVED_GUEST_FAVOUR' ||
      !d.requestedRefundAmount ||
      !d.booking.payment?.razorpayOrderId ||
      !d.resolvedBy
    )
      throw new Error('Invalid pending financial resolution');
    const result = await this.payments.initiateRefund({
      orderId: d.booking.payment.razorpayOrderId,
      refundAmount: Number(d.requestedRefundAmount),
      refundId: 'dispute_' + id.replace(/-/g, ''),
      refundNote: d.resolution || 'Dispute resolution',
    });
    if (result.status !== 'SUCCESS')
      throw new Error('Dispute refund is not yet confirmed');
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Booking" WHERE id=${d.bookingId} FOR UPDATE`;
      await tx.dispute.update({
        where: { id },
        data: { status: 'RESOLVED_GUEST_FAVOUR', resolvedAt: new Date() },
      });
      await tx.hostEarning.updateMany({
        where: { bookingId: d.bookingId, payoutStatus: { not: 'COMPLETED' } },
        data: { payoutStatus: 'ON_HOLD' },
      });
      await tx.adminAuditLog.create({
        data: {
          adminId: d.resolvedBy!,
          action: 'DISPUTE_REFUND_CONFIRMED',
          targetType: 'DISPUTE',
          targetId: id,
          details: {
            refundId: result.refundId,
            amount: Number(d.requestedRefundAmount),
          },
        },
      });
    });
  }
}
