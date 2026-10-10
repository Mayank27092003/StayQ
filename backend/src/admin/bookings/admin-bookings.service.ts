import { PaymentsService } from '../../payments/payments.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AvailabilityBlockType,
  BookingStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditService } from '../audit/admin-audit.service';
import {
  buildPaginatedResult,
  PaginatedResult,
  toSkipTake,
} from '../dto/pagination.dto';
import {
  decimalToNumber,
  roundCurrency,
  sumDecimals,
} from '../common/serialization';
import { RefundGatewayService } from './refund-gateway.service';
import {
  AdminBookingQueryDto,
  CancelBookingDto,
  CompleteBookingDto,
  ConfirmBookingDto,
  CreateRefundDto,
} from './dto/admin-booking.dto';

/** Transitions an admin may apply. Terminal states are not re-openable. */
const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.PENDING_PAYMENT]: [
    BookingStatus.CONFIRMED,
    BookingStatus.CANCELLED,
  ],
  [BookingStatus.PENDING_HOST_APPROVAL]: [
    BookingStatus.CONFIRMED,
    BookingStatus.CANCELLED,
  ],
  [BookingStatus.CONFIRMED]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
  [BookingStatus.CANCELLED]: [],
  [BookingStatus.COMPLETED]: [],
};

const LIST_INCLUDE = {
  guest: { select: { id: true, displayName: true, email: true, phone: true } },
  property: {
    select: {
      id: true,
      title: true,
      city: true,
      category: true,
      host: { select: { id: true, displayName: true, email: true } },
    },
  },
  payment: { select: { id: true, status: true, amount: true } },
} satisfies Prisma.BookingInclude;

@Injectable()
export class AdminBookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly refundGateway: RefundGatewayService,
    private readonly payments: PaymentsService,
  ) {}

  async list(query: AdminBookingQueryDto): Promise<PaginatedResult<unknown>> {
    const { skip, take } = toSkipTake(query);

    const where: Prisma.BookingWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.guestId) where.guestId = query.guestId;
    if (query.checkInFrom || query.checkInTo) {
      where.checkIn = {
        ...(query.checkInFrom ? { gte: new Date(query.checkInFrom) } : {}),
        ...(query.checkInTo ? { lte: new Date(query.checkInTo) } : {}),
      };
    }
    if (query.search) {
      where.OR = [
        { confirmationCode: { contains: query.search, mode: 'insensitive' } },
        {
          guest: {
            displayName: { contains: query.search, mode: 'insensitive' },
          },
        },
        { guest: { email: { contains: query.search, mode: 'insensitive' } } },
        {
          property: { title: { contains: query.search, mode: 'insensitive' } },
        },
      ];
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: LIST_INCLUDE,
      }),
      this.prisma.booking.count({ where }),
    ]);

    const data = bookings.map((booking) => ({
      id: booking.id,
      confirmationCode: booking.confirmationCode,
      status: booking.status,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      numberOfNights: booking.numberOfNights,
      adults: booking.adults,
      children: booking.children,
      // Canonical money field name is `totalAmount`, matching the schema.
      totalAmount: decimalToNumber(booking.totalAmount),
      couponCode: booking.couponCode,
      couponDiscount: decimalToNumber(booking.couponDiscount),
      createdAt: booking.createdAt,
      cancelledAt: booking.cancelledAt,
      guest: booking.guest,
      property: booking.property,
      payment: booking.payment
        ? {
            id: booking.payment.id,
            status: booking.payment.status,
            amount: decimalToNumber(booking.payment.amount),
          }
        : null,
    }));

    return buildPaginatedResult(data, total, query);
  }

  /** Full booking record including payment, refunds, and status timeline. */
  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        guest: {
          select: {
            id: true,
            displayName: true,
            email: true,
            phone: true,
            photoUrl: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            state: true,
            category: true,
            type: true,
            checkInTime: true,
            checkOutTime: true,
            cancellationPolicy: true,
            host: {
              select: {
                id: true,
                displayName: true,
                email: true,
                phone: true,
                isSuperhost: true,
              },
            },
            images: {
              select: { url: true },
              orderBy: { order: 'asc' },
              take: 1,
            },
          },
        },
        roomType: { select: { id: true, name: true } },
        payment: { include: { refunds: { orderBy: { createdAt: 'desc' } } } },
        review: {
          select: { id: true, rating: true, text: true, createdAt: true },
        },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        availabilityBlocks: {
          select: { id: true, startDate: true, endDate: true, type: true },
        },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found.');

    const refunds = booking.payment?.refunds ?? [];
    const refundedTotal = roundCurrency(
      sumDecimals(
        refunds.filter((r) => r.status === 'SUCCESS').map((r) => r.amount),
      ),
    );
    const paidAmount = decimalToNumber(booking.payment?.amount) ?? 0;

    return {
      id: booking.id,
      confirmationCode: booking.confirmationCode,
      status: booking.status,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      numberOfNights: booking.numberOfNights,
      adults: booking.adults,
      children: booking.children,
      pricing: {
        nightlyRate: decimalToNumber(booking.nightlyRate),
        subtotal: decimalToNumber(booking.subtotal),
        cleaningFee: decimalToNumber(booking.cleaningFee),
        serviceFee: decimalToNumber(booking.serviceFee),
        taxes: decimalToNumber(booking.taxes),
        couponCode: booking.couponCode,
        couponDiscount: decimalToNumber(booking.couponDiscount),
        totalAmount: decimalToNumber(booking.totalAmount),
      },
      cancellation: {
        policy: booking.cancellationPolicy,
        cancelledAt: booking.cancelledAt,
        cancelledBy: booking.cancelledBy,
        reason: booking.cancellationReason,
      },
      guest: booking.guest,
      property: booking.property,
      roomType: booking.roomType,
      payment: booking.payment
        ? {
            id: booking.payment.id,
            status: booking.payment.status,
            amount: paidAmount,
            currency: booking.payment.currency,
            platformCommission: decimalToNumber(
              booking.payment.platformCommission,
            ),
            hostPayout: decimalToNumber(booking.payment.hostPayout),
            capturedAt: booking.payment.capturedAt,
            releasedAt: booking.payment.releasedAt,
            // Present only when the payment actually went through the provider.
            gatewayOrderId: booking.payment.razorpayOrderId,
            gatewayPaymentId: booking.payment.razorpayPaymentId,
            refunds: refunds.map((refund) => ({
              id: refund.id,
              amount: decimalToNumber(refund.amount),
              reason: refund.reason,
              gatewayRefundId: refund.razorpayRefundId,
              status: refund.status,
              createdAt: refund.createdAt,
            })),
            refundedTotal,
            refundableAmount: roundCurrency(
              Math.max(0, paidAmount - refundedTotal),
            ),
          }
        : null,
      review: booking.review,
      statusHistory: booking.statusHistory,
      availabilityBlocks: booking.availabilityBlocks,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }

  private assertTransition(from: BookingStatus, to: BookingStatus): void {
    if (from === to) {
      throw new BadRequestException(`This booking is already ${from}.`);
    }
    if (!ALLOWED_TRANSITIONS[from].includes(to)) {
      throw new BadRequestException(
        `A booking cannot move from ${from} to ${to}.`,
      );
    }
  }

  /**
   * Applies a status change and appends a history row in one transaction, so the
   * timeline can never disagree with the booking's current state.
   */
  private async transition(
    id: string,
    to: BookingStatus,
    adminId: string,
    reason: string | undefined,
    extraData: Prisma.BookingUpdateInput = {},
    afterUpdate?: (
      tx: Prisma.TransactionClient,
      from: BookingStatus,
    ) => Promise<void>,
  ) {
    const existing = await this.prisma.booking.findUnique({
      where: { id },
      include: { payment: true },
    });
    if (!existing) throw new NotFoundException('Booking not found.');

    this.assertTransition(existing.status, to);

    return this.audit.runWithAudit(
      async (tx) => {
        // PESSIMISTIC LOCK: Lock booking row to serialize concurrent transitions
        await tx.$queryRaw`SELECT id FROM "Booking" WHERE id = ${id} FOR UPDATE`;
        const current = await tx.booking.findUnique({
          where: { id },
          include: { payment: true },
        });
        if (!current) throw new NotFoundException('Booking not found.');
        this.assertTransition(current.status, to);
        if (
          (to === BookingStatus.CONFIRMED || to === BookingStatus.COMPLETED) &&
          !(
            current.payment?.status === PaymentStatus.CAPTURED ||
            current.payment?.status === PaymentStatus.RELEASED
          )
        )
          throw new ConflictException(
            'Booking transition requires a captured payment',
          );
        if (to === BookingStatus.COMPLETED && current.checkOut > new Date())
          throw new ConflictException('Stay has not reached check-out');

        const updated = await tx.booking.update({
          where: { id },
          data: { status: to, ...extraData },
        });

        await tx.bookingStatusHistory.create({
          data: {
            bookingId: id,
            fromStatus: current.status,
            toStatus: to,
            actorType: 'admin',
            actorId: adminId,
            reason: reason ?? null,
          },
        });

        if (afterUpdate) await afterUpdate(tx, current.status);
        const type =
          to === BookingStatus.CANCELLED
            ? 'BOOKING_CANCELLED'
            : to === BookingStatus.COMPLETED
              ? 'BOOKING_COMPLETED'
              : 'BOOKING_CONFIRMED';
        const key = to.toLowerCase() + ':' + id;
        await tx.domainJob.upsert({
          where: { key },
          create: { key, type, referenceId: id },
          update: {},
        });

        return updated;
      },
      (updated) => ({
        adminId,
        action: `BOOKING_${to}`,
        targetType: 'BOOKING',
        targetId: updated.id,
        details: {
          previousStatus: existing.status,
          newStatus: to,
          reason: reason ?? null,
        },
      }),
    );
  }

  async confirm(id: string, dto: ConfirmBookingDto, adminId: string) {
    return this.transition(id, BookingStatus.CONFIRMED, adminId, dto.reason);
  }

  /**
   * Cancels a booking and releases its availability block, so the dates become
   * bookable again. Without the release the calendar would stay blocked.
   */
  async cancel(id: string, dto: CancelBookingDto, adminId: string) {
    return this.transition(
      id,
      BookingStatus.CANCELLED,
      adminId,
      dto.reason,
      {
        cancelledAt: new Date(),
        cancelledBy: 'admin',
        cancellationReason: dto.reason,
      },
      async (tx) => {
        await tx.availabilityBlock.deleteMany({
          where: { bookingId: id, type: AvailabilityBlockType.BOOKED },
        });
      },
    );
  }

  /** Marks a stay complete. Refused before checkout has passed. */
  async complete(id: string, dto: CompleteBookingDto, adminId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      select: { checkOut: true },
    });
    if (!booking) throw new NotFoundException('Booking not found.');

    if (booking.checkOut.getTime() > Date.now()) {
      throw new BadRequestException(
        'This booking cannot be completed before its check-out date has passed.',
      );
    }

    return this.transition(id, BookingStatus.COMPLETED, adminId, dto.reason);
  }

  /**
   * Issues a real refund through the payment gateway, then records it.
   *
   * The gateway call happens before any database write: if the provider rejects
   * the request nothing is persisted, so a refund row always corresponds to
   * money that actually left the account.
   */
  async refund(
    bookingId: string,
    dto: CreateRefundDto,
    adminId: string,
    key?: string,
  ) {
    const b = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: { include: { refunds: true } } },
    });
    if (!b?.payment?.razorpayOrderId)
      throw new NotFoundException('Captured booking payment not found');
    const remaining =
      Number(b.payment.amount) -
      b.payment.refunds
        .filter((r) => !['FAILED', 'CANCELLED'].includes(r.status))
        .reduce((sum, r) => sum + Number(r.amount), 0);
    if (!key)
      throw new BadRequestException(
        'Idempotency-Key is required for an admin refund',
      );
    const result = await this.payments.initiateRefund({
      orderId: b.payment.razorpayOrderId,
      refundAmount: dto.amount ?? remaining,
      refundId:
        'adm_' +
        require('crypto')
          .createHash('sha256')
          .update(adminId + ':' + key)
          .digest('hex')
          .slice(0, 32),
      refundNote: dto.reason || 'Admin refund',
    });
    await this.audit.record({
      adminId,
      action: 'REFUND_BOOKING',
      targetType: 'PAYMENT',
      targetId: b.payment.id,
      details: {
        bookingId,
        refundId: result.refundId,
        amount: result.amount,
        status: result.status,
      },
    });
    return {
      ...result,
      gatewayRefundId: result.refundId,
      gatewayStatus: result.status,
    };
  }

  /** Reports whether refunds can be issued, so the UI can explain why not. */
  refundCapability() {
    const configured = this.refundGateway.isConfigured();

    return {
      available: configured,
      reason: configured
        ? null
        : 'The payment gateway credentials are not configured on the API, so refunds cannot be issued.',
    };
  }
}
