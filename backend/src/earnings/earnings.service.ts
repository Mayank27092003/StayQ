import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CommissionService,
  commissionRules,
} from '../commission/commission.service';
import { MoneyUtil } from '../common/utils/money.util';
import { text } from '../common/utils/input.util';
@Injectable()
export class EarningsService {
  constructor(
    private prisma: PrismaService,
    private commissions: CommissionService,
  ) {}
  async calculateAndCreateEarning(bookingId: string) {
    const fallback = await this.commissions.getSettings();
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Booking" WHERE id=${bookingId} FOR UPDATE`;
      const b = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { property: true, payment: true, dispute: true },
      });
      if (!b) throw new NotFoundException('Booking not found');
      const existing = await tx.hostEarning.findUnique({
        where: { bookingId },
      });
      if (existing) return existing;
      if (
        !['CONFIRMED', 'COMPLETED'].includes(b.status) ||
        !['CAPTURED', 'RELEASED'].includes(b.payment?.status || '')
      )
        throw new ConflictException('Captured paid booking required');
      const rules = b.pricingRules ? commissionRules(b.pricingRules) : fallback;
      const wallet = await tx.walletEntry.findFirst({
        where: { userId: b.guestId, referenceId: bookingId, type: 'DEBIT' },
      });
      // Discounts reduce the funded rental amount; no unrecorded subsidy is promised.
      const gross = MoneyUtil.round(
        Math.max(
          0,
          MoneyUtil.subtract(
            MoneyUtil.subtract(
              MoneyUtil.add(Number(b.subtotal), Number(b.cleaningFee)),
              Number(b.couponDiscount),
            ),
            Number(wallet?.amount || 0),
          ),
        ),
      );
      const fee = MoneyUtil.percentage(gross, rules.hostCommissionPercent),
        tds = MoneyUtil.percentage(gross, rules.tdsRatePercent),
        platform = MoneyUtil.add(fee, Number(b.serviceFee)),
        net = MoneyUtil.subtract(MoneyUtil.subtract(gross, fee), tds);
      const refunds = await tx.refund.count({
        where: {
          paymentId: b.payment!.id,
          status: { notIn: ['FAILED', 'CANCELLED'] },
        },
      });
      const result = await tx.hostEarning.create({
        data: {
          hostId: b.property.hostId,
          bookingId,
          grossAmount: gross,
          platformFee: platform,
          taxDeducted: tds,
          netPayout: net,
          payoutStatus:
            refunds ||
            (b.dispute &&
              !['CLOSED', 'RESOLVED_HOST_FAVOUR'].includes(b.dispute.status))
              ? 'ON_HOLD'
              : 'PENDING',
        },
      });
      await tx.payment.update({
        where: { bookingId },
        data: { platformCommission: platform, hostPayout: net },
      });
      return result;
    });
  }
  async cancelEarning(bookingId: string, reason?: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Booking" WHERE id=${bookingId} FOR UPDATE`;
      const e = await tx.hostEarning.findUnique({ where: { bookingId } });
      if (!e) return null;
      return tx.hostEarning.update({
        where: { id: e.id },
        data:
          e.payoutStatus === 'COMPLETED'
            ? { recoveryRequired: true }
            : { payoutStatus: 'ON_HOLD', netPayout: 0 },
      });
    });
  }
  async getHostEarnings(hostId: string) {
    return this.prisma.hostEarning.findMany({
      where: { hostId },
      orderBy: { createdAt: 'desc' },
      include: { booking: true },
      take: 500,
    });
  }
  async releasePayout(
    id: string,
    reference: string,
    transferCompleted = false,
    adminId?: string,
  ) {
    if (!adminId)
      throw new BadRequestException(
        'Authenticated finance administrator required',
      );
    if (process.env.PAYOUT_MODE !== 'MANUAL')
      throw new ServiceUnavailableException(
        'Payout settlement is not configured',
      );
    if (transferCompleted !== true)
      throw new BadRequestException(
        'Confirm the external bank transfer is completed before recording it',
      );
    const ref = text(reference, 'Bank transfer reference', 100);
    if (!/^[A-Za-z0-9._-]{6,100}$/.test(ref))
      throw new BadRequestException('Invalid bank transfer reference');
    const fallback = await this.commissions.getSettings();
    return this.prisma.$transaction(async (tx) => {
      const key = 'payout-reference:' + ref;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key},0))`;
      const initial = await tx.hostEarning.findUnique({ where: { id } });
      if (!initial) throw new NotFoundException('Earning not found');
      await tx.$queryRaw`SELECT id FROM "Booking" WHERE id=${initial.bookingId} FOR UPDATE`;
      const e = await tx.hostEarning.findUnique({
        where: { id },
        include: {
          host: { include: { payoutAccount: true } },
          booking: { include: { dispute: true, payment: true } },
        },
      });
      if (!e) throw new NotFoundException('Earning not found');
      if (e.payoutStatus === 'COMPLETED') {
        if (e.payoutReference !== ref)
          throw new ConflictException(
            'Payout already recorded with another reference',
          );
        return { ...e, providerVerified: false, recordedManualTransfer: true };
      }
      if (
        await tx.hostEarning.findFirst({
          where: { payoutReference: ref, id: { not: id } },
        })
      )
        throw new ConflictException('Transfer reference already recorded');
      if (
        await tx.refund.count({
          where: {
            paymentId: e.booking.payment?.id || '',
            status: { notIn: ['FAILED', 'CANCELLED'] },
          },
        })
      )
        throw new ConflictException(
          'Refunded stays require reviewed settlement before payout',
        );
      const rules = e.booking.pricingRules
        ? commissionRules(e.booking.pricingRules)
        : fallback;
      if (
        !e.host.payoutAccount?.verified ||
        e.host.deletedAt ||
        e.payoutStatus === 'ON_HOLD' ||
        e.recoveryRequired ||
        Number(e.netPayout) <= 0 ||
        e.booking.status !== 'COMPLETED' ||
        !['CAPTURED', 'RELEASED'].includes(e.booking.payment?.status || '') ||
        e.booking.checkOut.getTime() + rules.payoutEscrowHours * 3600000 >
          Date.now() ||
        (e.booking.dispute &&
          !['RESOLVED_HOST_FAVOUR', 'CLOSED'].includes(
            e.booking.dispute.status,
          ))
      )
        throw new ConflictException('Payout is not eligible for settlement');
      const result = await tx.hostEarning.update({
        where: { id },
        data: {
          payoutStatus: 'COMPLETED',
          payoutReference: ref,
          payoutDate: new Date(),
        },
      });
      await tx.adminAuditLog.create({
        data: {
          adminId: adminId,
          action: 'RECORD_MANUAL_PAYOUT',
          targetType: 'HOST_EARNING',
          targetId: id,
          details: { reference: ref, providerVerified: false },
        },
      });
      return {
        ...result,
        providerVerified: false,
        recordedManualTransfer: true,
      };
    });
  }
}
