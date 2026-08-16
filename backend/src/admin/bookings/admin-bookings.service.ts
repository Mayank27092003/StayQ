import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  AvailabilityBlockType,
  BookingStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditService } from '../audit/admin-audit.service';
import { buildPaginatedResult, PaginatedResult, toSkipTake } from '../dto/pagination.dto';
import { decimalToNumber, roundCurrency, sumDecimals } from '../common/serialization';
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
  [BookingStatus.PENDING_PAYMENT]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.PENDING_HOST_APPROVAL]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
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
        { guest: { displayName: { contains: query.search, mode: 'insensitive' } } },
        { guest: { email: { contains: query.search, mode: 'insensitive' } } },
        { property: { title: { contains: query.search, mode: 'insensitive' } } },
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
          select: { id: true, displayName: true, email: true, phone: true, photoUrl: true },
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
              select: { id: true, displayName: true, email: true, phone: true, isSuperhost: true },
            },
            images: { select: { url: true }, orderBy: { order: 'asc' }, take: 1 },
          },
        },
        roomType: { select: { id: true, name: true } },
        payment: { include: { refunds: { orderBy: { createdAt: 'desc' } } } },
        review: { select: { id: true, rating: true, text: true, createdAt: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        availabilityBlocks: {
          select: { id: true, startDate: true, endDate: true, type: true },
        },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found.');

    const refunds = booking.payment?.refunds ?? [];
    const refundedTotal = roundCurrency(sumDecimals(refunds.map((r) => r.amount)));
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
            platformCommission: decimalToNumber(booking.payment.platformCommission),
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
              createdAt: refund.createdAt,
            })),
            refundedTotal,
            refundableAmount: roundCurrency(Math.max(0, paidAmount - refundedTotal)),
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
      throw new BadRequestException(`A booking cannot move from ${from} to ${to}.`);
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
    afterUpdate?: (tx: Prisma.TransactionClient, from: BookingStatus) => Promise<void>,
  ) {
    const existing = await this.prisma.booking.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!existing) throw new NotFoundException('Booking not found.');

    this.assertTransition(existing.status, to);

    return this.audit.runWithAudit(
      async (tx) => {
        const updated = await tx.booking.update({
          where: { id },
          data: { status: to, ...extraData },
        });

        await tx.bookingStatusHistory.create({
          data: {
            bookingId: id,
            fromStatus: existing.status,
            toStatus: to,
            actorType: 'admin',
            actorId: adminId,
            reason: reason ?? null,
          },
        });

        if (afterUpdate) await afterUpdate(tx, existing.status);

        return updated;
      },
      (updated) => ({
        adminId,
        action: `BOOKING_${to}`,
        targetType: 'BOOKING',
        targetId: updated.id,
        details: { previousStatus: existing.status, newStatus: to, reason: reason ?? null },
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
  async refund(bookingId: string, dto: CreateRefundDto, adminId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: { include: { refunds: true } } },
    });
    if (!booking) throw new NotFoundException('Booking not found.');

    const payment = booking.payment;
    if (!payment) {
      throw new UnprocessableEntityException(
        'This booking has no payment record, so there is nothing to refund.',
      );
    }
    if (payment.status === PaymentStatus.PENDING) {
      throw new UnprocessableEntityException(
        'This payment was never captured, so it cannot be refunded.',
      );
    }
    if (!payment.razorpayPaymentId) {
      // Guards against reporting a refund for a payment that never reached the
      // provider. The current checkout path can create orders without a real
      // gateway payment id, and those cannot be refunded.
      throw new UnprocessableEntityException(
        'This payment has no gateway payment id, so no real refund can be issued. It was not captured through the payment provider.',
      );
    }

    const paidAmount = decimalToNumber(payment.amount) ?? 0;
    const alreadyRefunded = sumDecimals(payment.refunds.map((r) => r.amount));
    const refundable = roundCurrency(paidAmount - alreadyRefunded);

    if (refundable <= 0) {
      throw new ConflictException('This payment has already been fully refunded.');
    }

    const amount = roundCurrency(dto.amount ?? refundable);
    if (amount > refundable) {
      throw new BadRequestException(
        `The requested refund of ${amount} exceeds the refundable balance of ${refundable}.`,
      );
    }

    const gatewayResult = await this.refundGateway.refund(payment.razorpayPaymentId, amount, {
      bookingId,
      confirmationCode: booking.confirmationCode,
      adminId,
    });

    const fullyRefunded = roundCurrency(alreadyRefunded + amount) >= paidAmount;

    return this.audit.runWithAudit(
      async (tx) => {
        const refund = await tx.refund.create({
          data: {
            paymentId: payment.id,
            amount: new Prisma.Decimal(amount),
            reason: dto.reason,
            razorpayRefundId: gatewayResult.gatewayRefundId,
          },
        });

        if (fullyRefunded) {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: PaymentStatus.REFUNDED },
          });
        }

        return {
          id: refund.id,
          amount: decimalToNumber(refund.amount),
          reason: refund.reason,
          gatewayRefundId: refund.razorpayRefundId,
          gatewayStatus: gatewayResult.status,
          createdAt: refund.createdAt,
          paymentFullyRefunded: fullyRefunded,
        };
      },
      (refund) => ({
        adminId,
        action: 'REFUND_BOOKING',
        targetType: 'PAYMENT',
        targetId: payment.id,
        details: {
          bookingId,
          refundId: refund.id,
          amount,
          reason: dto.reason,
          gatewayRefundId: gatewayResult.gatewayRefundId,
        },
      }),
    );
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
