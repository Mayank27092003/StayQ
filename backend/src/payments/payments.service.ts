import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BookingStatus } from '@prisma/client';
import { BookingsService } from '../bookings/bookings.service';
import { EarningsService } from '../earnings/earnings.service';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'crypto';
import {
  money,
  text,
  fingerprint,
  idempotencyKey,
} from '../common/utils/input.util';

export interface CreateOrderParams {
  bookingId?: string;
  amount: number;
  idempotencyKey?: string;
  authenticatedUser?: any;
  purpose?: 'BOOKING' | 'HOST_PRO' | 'BOOST' | 'LOYALTY';
  referenceId?: string;
  sku?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  returnUrl?: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly cashfreeAppId =
    process.env.CASHFREE_PG_APP_ID || process.env.CASHFREE_CLIENT_ID || '';
  private readonly cashfreeSecretKey =
    process.env.CASHFREE_PG_SECRET_KEY ||
    process.env.CASHFREE_CLIENT_SECRET ||
    '';
  private readonly cashfreePgBaseUrl =
    process.env.CASHFREE_PG_BASE_URL ||
    (process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg');
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly earningsService: EarningsService,
    @Inject(forwardRef(() => BookingsService))
    private readonly bookingsService: BookingsService,
  ) {}

  private environment(): string {
    const allowed = {
      'https://api.cashfree.com/pg': 'PRODUCTION',
      'https://sandbox.cashfree.com/pg': 'SANDBOX',
    };
    const value = allowed[this.cashfreePgBaseUrl];
    if (
      !value ||
      (process.env.CASHFREE_ENVIRONMENT &&
        process.env.CASHFREE_ENVIRONMENT !== value)
    )
      throw new ServiceUnavailableException(
        'Payment gateway environment configuration is invalid',
      );
    if (!this.cashfreeAppId || !this.cashfreeSecretKey)
      throw new ServiceUnavailableException(
        'Payment gateway is not configured',
      );
    return value;
  }
  private async gateway(
    path: string,
    method = 'GET',
    payload?: any,
    key?: string,
  ): Promise<any> {
    this.environment();
    try {
      const response = await fetch(this.cashfreePgBaseUrl + path, {
        method,
        signal: AbortSignal.timeout(10000),
        headers: {
          'x-client-id': this.cashfreeAppId,
          'x-client-secret': this.cashfreeSecretKey,
          'x-api-version': '2023-08-01',
          'Content-Type': 'application/json',
          ...(key ? { 'x-idempotency-key': key } : {}),
        },
        ...(payload ? { body: JSON.stringify(payload) } : {}),
      });
      if (response.status === 404)
        throw new NotFoundException('Gateway order was not found');
      if (!response.ok)
        throw new ServiceUnavailableException(
          'Payment gateway could not complete the request; retry the same order',
        );
      return await response.json();
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ServiceUnavailableException
      )
        throw error;
      throw new ServiceUnavailableException(
        'Payment gateway is unavailable; retry the same order',
      );
    }
  }
  private session(order: any) {
    if (!order.paymentSessionId)
      throw new ServiceUnavailableException(
        'Payment session is pending reconciliation; retry this request',
      );
    return {
      success: true,
      orderId: order.orderId,
      order_id: order.orderId,
      paymentSessionId: order.paymentSessionId,
      payment_session_id: order.paymentSessionId,
      amount: Number(order.amount),
      currency: order.currency,
      status: order.status,
      bookingId: order.purpose === 'BOOKING' ? order.referenceId : null,
      environment: order.environment,
      gateway: 'CASHFREE',
    };
  }
  private assertGatewayOrder(order: any, data: any) {
    if (
      data.order_id !== order.orderId ||
      data.order_currency !== order.currency ||
      money(data.order_amount) !== Number(order.amount)
    ) {
      throw new ConflictException(
        'Gateway order amount, currency or identity does not match the stored purchase',
      );
    }
  }
  async createCashfreeOrder(params: CreateOrderParams) {
    const user = params.authenticatedUser;
    if (!user?.id)
      throw new UnauthorizedException(
        'Authenticated purchase owner is required',
      );
    const environment = this.environment();
    const purpose = params.purpose || 'BOOKING';
    const referenceId = text(
      purpose === 'BOOKING' ? params.bookingId : params.referenceId,
      'Purchase reference',
    );
    let amount = params.amount;
    let customer = user;
    let booking: any;
    if (purpose === 'BOOKING') {
      booking = await this.prisma.booking.findUnique({
        where: { id: referenceId },
        include: { guest: true, payment: true },
      });
      if (!booking) throw new NotFoundException('Booking not found');
      if (booking.guestId !== user.id)
        throw new ForbiddenException(
          'Only the booking guest can pay for this booking',
        );
      amount = Number(booking.totalAmount);
      customer = booking.guest;
    }
    amount = money(amount);
    const clientKey = idempotencyKey(params.idempotencyKey);
    // A booking has one canonical gateway order, even when the client loses its attempt key.
    const key =
      purpose === 'BOOKING'
        ? `booking:${referenceId}`
        : `${user.id}:${purpose}:${clientKey || randomUUID()}`;
    const hash = fingerprint({
      ownerId: user.id,
      purpose,
      referenceId,
      sku: params.sku || null,
      amount,
      currency: 'INR',
    });
    const order = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
      const existing = await tx.gatewayOrder.findUnique({
        where: { idempotencyKey: key },
      });
      if (existing) {
        if (existing.requestHash !== hash)
          throw new ConflictException(
            'Idempotency key was already used for a different purchase',
          );
        return existing;
      }
      if (purpose === 'BOOKING') {
        const current = await tx.booking.findUnique({
          where: { id: referenceId },
          include: { payment: true },
        });
        if (!current || current.status !== BookingStatus.PENDING_PAYMENT)
          throw new ConflictException('Booking cannot accept a new payment');
        if (Date.now() - current.createdAt.getTime() >= 15 * 60 * 1000)
          throw new ConflictException(
            'Booking hold has expired; create a new booking',
          );
        if (current.payment)
          throw new ConflictException(
            'A payment already exists for this booking; reconcile its existing order',
          );
      }
      const id = randomUUID();
      const row = await tx.gatewayOrder.create({
        data: {
          id,
          orderId: `sq_${id.replace(/-/g, '')}`,
          ownerId: user.id,
          purpose,
          referenceId,
          sku: params.sku,
          amount,
          environment,
          idempotencyKey: key,
          requestHash: hash,
        },
      });
      if (purpose === 'BOOKING')
        await tx.payment.create({
          data: {
            bookingId: referenceId,
            amount,
            currency: 'INR',
            status: 'PENDING',
            razorpayOrderId: row.orderId,
            idempotencyKey: key,
          },
        });
      return row;
    });
    if (order.paymentSessionId) return this.session(order);
    const phone = String(customer.phone || params.customerPhone || '').replace(
      /[^0-9]/g,
      '',
    );
    if (phone.length < 10 || phone.length > 15)
      throw new BadRequestException(
        'A real customer phone number is required for checkout',
      );
    const email = customer.email || params.customerEmail;
    if (
      email &&
      (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    )
      throw new BadRequestException('Invalid customer email');
    const notify = process.env.PUBLIC_API_URL;
    const meta: any = {};
    if (notify)
      meta.notify_url = `${notify.replace(/\/$/, '')}/payments/webhook/cashfree`;
    if (process.env.PAYMENT_RETURN_URL)
      meta.return_url = process.env.PAYMENT_RETURN_URL;
    let data: any;
    try {
      data = await this.gateway(`/orders/${encodeURIComponent(order.orderId)}`);
    } catch (error) {
      if (!(error instanceof NotFoundException)) throw error;
    }
    if (!data) {
      try {
        data = await this.gateway(
          '/orders',
          'POST',
          {
            order_id: order.orderId,
            order_amount: amount,
            order_currency: 'INR',
            customer_details: {
              customer_id: user.id,
              customer_phone: phone,
              ...(email ? { customer_email: email } : {}),
              ...(customer.displayName
                ? { customer_name: customer.displayName }
                : {}),
            },
            order_meta: meta,
          },
          order.id,
        );
      } catch (error) {
        // A timeout can occur after creation. Recover the real session, never invent one.
        try {
          data = await this.gateway(
            `/orders/${encodeURIComponent(order.orderId)}`,
          );
        } catch {
          throw error;
        }
      }
    }
    this.assertGatewayOrder(order, data);
    if (!data.payment_session_id)
      throw new ServiceUnavailableException(
        'Gateway returned no payment session',
      );
    const saved = await this.prisma.gatewayOrder.update({
      where: { id: order.id },
      data: {
        paymentSessionId: data.payment_session_id,
        status: order.status === 'PAID' ? 'PAID' : 'ACTIVE',
      },
    });
    return this.session(saved);
  }
  async getOwnedOrder(
    orderId: string,
    user: any,
    purpose?: string,
    referenceId?: string,
    sku?: string,
  ) {
    if (!user?.id)
      throw new UnauthorizedException(
        'Authenticated purchase owner is required',
      );
    const order = await this.prisma.gatewayOrder.findUnique({
      where: { orderId: text(orderId, 'Order ID') },
    });
    if (!order) throw new NotFoundException('Stored payment order not found');
    if (order.ownerId !== user.id)
      throw new ForbiddenException('This purchase belongs to another account');
    if (
      (purpose && order.purpose !== purpose) ||
      (referenceId && order.referenceId !== referenceId) ||
      (sku && order.sku !== sku)
    )
      throw new ConflictException('Payment is not for this purchase');
    return order;
  }
  async verifyPayment(orderId: string, user?: any) {
    const order = await this.getOwnedOrder(orderId, user);
    return this.reconcile(order);
  }
  private async reconcile(order: any) {
    if (order.environment !== this.environment())
      throw new ConflictException(
        'Order belongs to a different gateway environment',
      );
    const data = await this.gateway(
      `/orders/${encodeURIComponent(order.orderId)}`,
    );
    this.assertGatewayOrder(order, data);
    if (data.order_status === 'PAID') {
      const payments = await this.gateway(
        `/orders/${encodeURIComponent(order.orderId)}/payments`,
      );
      const successful =
        Array.isArray(payments) &&
        payments.find(
          (p) =>
            p.payment_status === 'SUCCESS' &&
            p.order_id === order.orderId &&
            Number(p.payment_amount) === Number(order.amount) &&
            p.payment_currency === order.currency &&
            p.cf_payment_id,
        );
      if (!successful)
        throw new ServiceUnavailableException(
          'Paid order has no matching successful payment; reconciliation is pending',
        );
      await this.markPaymentCaptured(
        order.orderId,
        String(successful.cf_payment_id),
      );
    }
    const saved = await this.prisma.gatewayOrder.findUnique({
      where: { id: order.id },
    });
    return {
      orderId: order.orderId,
      isPaid: saved?.status === 'PAID',
      status:
        saved?.status === 'PAID' ? 'PAID' : data.order_status || 'PENDING',
      paymentId: saved?.paymentReference || null,
      details: {
        order_amount: Number(order.amount),
        order_currency: order.currency,
        order_status: data.order_status,
      },
    };
  }
  async markPaymentCaptured(orderId: string, referenceId?: string) {
    if (!referenceId)
      throw new BadRequestException(
        'A verified gateway payment reference is required',
      );
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`capture:${orderId}`}, 0))`;
      const order = await tx.gatewayOrder.findUnique({ where: { orderId } });
      if (!order) throw new NotFoundException('Stored payment order not found');
      if (order.status === 'PAID') return;
      await tx.gatewayOrder.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          paymentReference: referenceId,
        },
      });
      if (order.purpose !== 'BOOKING') return;
      await tx.$queryRaw`SELECT id FROM "Booking" WHERE id = ${order.referenceId} FOR UPDATE`;
      const booking = await tx.booking.findUnique({
        where: { id: order.referenceId },
        include: { property: true, payment: true },
      });
      if (
        !booking ||
        !booking.payment ||
        booking.payment.razorpayOrderId !== orderId ||
        Number(booking.payment.amount) !== Number(order.amount)
      )
        throw new ConflictException('Booking payment binding is invalid');
      await tx.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: 'CAPTURED',
          capturedAt: new Date(),
          razorpayPaymentId: referenceId,
        },
      });
      if (
        booking.status === BookingStatus.PENDING_PAYMENT &&
        booking.createdAt.getTime() <= Date.now() - 15 * 60000
      ) {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancelledBy: 'system',
            cancellationReason:
              'Payment was received after the reservation hold expired',
          },
        });
        await tx.availabilityBlock.deleteMany({
          where: { bookingId: booking.id },
        });
        booking.status = BookingStatus.CANCELLED;
      }
      if (booking.status !== BookingStatus.PENDING_PAYMENT) {
        if (booking.status === BookingStatus.CANCELLED)
          await tx.domainJob.upsert({
            where: { key: `late-refund:${booking.id}` },
            create: {
              key: `late-refund:${booking.id}`,
              type: 'LATE_REFUND',
              referenceId: booking.id,
            },
            update: {},
          });
        return;
      }
      const status = booking.property.instantBook
        ? BookingStatus.CONFIRMED
        : BookingStatus.PENDING_HOST_APPROVAL;
      await tx.booking.update({ where: { id: booking.id }, data: { status } });
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: booking.status,
          toStatus: status,
          actorType: 'system',
          reason: 'Verified Cashfree payment',
        },
      });
      await tx.domainJob.upsert({
        where: { key: `paid:${booking.id}` },
        create: {
          key: `paid:${booking.id}`,
          type:
            status === 'CONFIRMED' ? 'BOOKING_CONFIRMED' : 'BOOKING_REQUEST',
          referenceId: booking.id,
        },
        update: {},
      });
    });
  }
  verifyWebhookSignature(
    rawBody: string,
    signature: string,
    timestamp?: string,
  ): boolean {
    if (
      !signature ||
      !timestamp ||
      !/^\d{10,16}$/.test(timestamp) ||
      !this.cashfreeSecretKey
    )
      return false;
    try {
      const expected = createHmac('sha256', this.cashfreeSecretKey)
        .update(timestamp + rawBody)
        .digest('base64');
      return (
        signature.length === expected.length &&
        timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
      );
    } catch {
      return false;
    }
  }
  async handleCashfreeWebhook(
    event: any,
    rawBody?: Buffer,
    signature?: string,
    timestamp?: string,
  ) {
    if (
      !rawBody ||
      !this.verifyWebhookSignature(
        rawBody.toString('utf8'),
        signature || '',
        timestamp,
      )
    )
      throw new UnauthorizedException('Invalid Cashfree webhook signature');
    const orderId = event?.data?.order?.order_id;
    if (event?.type === 'PAYMENT_SUCCESS_WEBHOOK' && orderId) {
      const order = await this.prisma.gatewayOrder.findUnique({
        where: { orderId },
      });
      if (!order)
        throw new NotFoundException('Webhook order is not registered');
      await this.reconcile(order);
    }
    // Signed redeliveries may be old. Durable order locks provide replay protection;
    // do not drop legitimate delayed events based only on delivery timestamp.
    return { status: 'ok' };
  }
  async consumePaidOrder(
    orderId: string,
    user: any,
    purpose: string,
    referenceId: string,
    sku: string,
    activate: (tx: any, order: any) => Promise<any>,
  ) {
    const owned = await this.getOwnedOrder(
      orderId,
      user,
      purpose,
      referenceId,
      sku,
    );
    if (!owned.paidAt) {
      const verified = await this.verifyPayment(orderId, user);
      if (!verified.isPaid)
        throw new ConflictException('Payment is not confirmed');
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "GatewayOrder" WHERE id = ${owned.id} FOR UPDATE`;
      const order = await tx.gatewayOrder.findUniqueOrThrow({
        where: { id: owned.id },
      });
      if (order.status !== 'PAID' || !order.paidAt)
        throw new ConflictException('Payment is not confirmed');
      if (order.activatedAt) {
        const cached = JSON.parse(JSON.stringify(order.activationResult));
        const expires = cached?.expiresAt || cached?.boost?.endDate;
        if (expires && new Date(expires) <= new Date()) {
          cached.isActive = false;
          cached.status = 'EXPIRED';
          if (cached.subscription) cached.subscription.status = 'EXPIRED';
          if (cached.boost) cached.boost.isActive = false;
        }
        return cached;
      }
      const result = await activate(tx, order);
      await tx.gatewayOrder.update({
        where: { id: order.id },
        data: {
          activatedAt: new Date(),
          activationResult: JSON.parse(JSON.stringify(result)),
        },
      });
      return result;
    });
  }
  async initiateRefund(params: {
    orderId: string;
    refundAmount: number;
    refundId?: string;
    refundNote?: string;
    actorId?: string;
  }) {
    const amount = money(params.refundAmount, 'Refund amount');
    const orderId = text(params.orderId, 'Order ID');
    const refundId =
      params.refundId ||
      `ref_${createHash('sha256')
        .update(`${orderId}:${amount}:${params.refundNote || ''}`)
        .digest('hex')
        .slice(0, 32)}`;
    const refund = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`refund:${orderId}`}, 0))`;
      const payment = await tx.payment.findUnique({
        where: { razorpayOrderId: orderId },
        include: { refunds: true },
      });
      if (
        !payment ||
        !['CAPTURED', 'RELEASED', 'REFUNDED'].includes(payment.status)
      )
        throw new ConflictException(
          'No captured booking payment is available for refund',
        );
      await tx.$queryRaw`SELECT id FROM "Booking" WHERE id=${payment.bookingId} FOR UPDATE`;
      const existing = payment.refunds.find(
        (r) => r.razorpayRefundId === refundId,
      );
      if (existing) {
        if (existing.status === 'UNKNOWN')
          throw new ConflictException(
            'Historical refund requires manual provider reconciliation',
          );
        if (Number(existing.amount) !== amount)
          throw new ConflictException(
            'Refund ID was used for a different amount',
          );
        return existing;
      }
      const reserved = payment.refunds
        .filter((r) => r.status !== 'FAILED' && r.status !== 'CANCELLED')
        .reduce((sum, r) => sum + Math.round(Number(r.amount) * 100), 0);
      if (
        reserved + Math.round(amount * 100) >
        Math.round(Number(payment.amount) * 100)
      )
        throw new BadRequestException(
          'Refund exceeds the remaining captured balance',
        );
      const created = await tx.refund.create({
        data: {
          paymentId: payment.id,
          amount,
          reason: params.refundNote,
          razorpayRefundId: refundId,
          status: 'PENDING',
        },
      });
      await tx.domainJob.create({
        data: {
          key: 'refund:' + created.id,
          type: 'REFUND_RECONCILE',
          referenceId: created.id,
        },
      });
      if (params.actorId)
        await tx.adminAuditLog.create({
          data: {
            adminId: params.actorId,
            action: 'RESERVE_PAYMENT_REFUND',
            targetType: 'PAYMENT',
            targetId: payment.id,
            details: { refundId, amount },
          },
        });
      return created;
    });
    if (refund.status === 'SUCCESS')
      return {
        refundId,
        orderId,
        amount,
        status: 'SUCCESS',
        success: true,
        pending: false,
      };
    // Reserve first. Uncertain gateway outcomes remain pending and are recovered
    // with the same refund ID instead of spending the captured balance again.
    let data: any;
    try {
      data = await this.gateway(
        `/orders/${encodeURIComponent(orderId)}/refunds/${encodeURIComponent(refundId)}`,
      );
    } catch (error) {
      if (!(error instanceof NotFoundException)) throw error;
    }
    if (!data)
      data = await this.gateway(
        `/orders/${encodeURIComponent(orderId)}/refunds`,
        'POST',
        {
          refund_id: refundId,
          refund_amount: amount,
          refund_note: params.refundNote || 'Booking refund',
        },
        refund.id,
      );
    if (data.refund_id !== refundId || Number(data.refund_amount) !== amount)
      throw new ConflictException(
        'Gateway refund does not match the reserved refund',
      );
    const status = ['SUCCESS', 'FAILED', 'CANCELLED'].includes(
      data.refund_status,
    )
      ? data.refund_status
      : 'PENDING';
    const finalStatus = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`refund:${orderId}`}, 0))`;
      const linked = await tx.payment.findUniqueOrThrow({
        where: { id: refund.paymentId },
      });
      await tx.$queryRaw`SELECT id FROM "Booking" WHERE id=${linked.bookingId} FOR UPDATE`;
      const currentRefund = await tx.refund.findUniqueOrThrow({
        where: { id: refund.id },
      });
      if (currentRefund.status === 'SUCCESS') return 'SUCCESS';
      await tx.refund.update({ where: { id: refund.id }, data: { status } });
      if (status === 'SUCCESS') {
        await tx.hostEarning.updateMany({
          where: {
            bookingId: linked.bookingId,
            payoutStatus: { not: 'COMPLETED' },
          },
          data: { payoutStatus: 'ON_HOLD' },
        });
        await tx.hostEarning.updateMany({
          where: { bookingId: linked.bookingId, payoutStatus: 'COMPLETED' },
          data: { recoveryRequired: true },
        });
      }
      const successful = await tx.refund.findMany({
        where: { paymentId: refund.paymentId, status: 'SUCCESS' },
      });
      const payment = await tx.payment.findUniqueOrThrow({
        where: { id: refund.paymentId },
      });
      if (
        successful.reduce(
          (sum, r) => sum + Math.round(Number(r.amount) * 100),
          0,
        ) >= Math.round(Number(payment.amount) * 100)
      )
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'REFUNDED' },
        });
      return status;
    });
    return {
      refundId,
      orderId,
      amount,
      status: finalStatus,
      success: finalStatus === 'SUCCESS',
      pending: finalStatus === 'PENDING',
    };
  }
  async createRazorpayOrder(bookingId: string, amount: number, key: string) {
    throw new BadRequestException(
      'Legacy checkout is disabled; use authenticated Cashfree booking checkout',
    );
  }
  async handleWebhook(event: any, rawBody: Buffer, signature: string) {
    throw new BadRequestException(
      'Legacy Razorpay webhook is disabled; use the Cashfree webhook endpoint',
    );
  }
}
