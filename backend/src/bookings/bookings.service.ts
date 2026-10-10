import { isOperationsAdmin } from '../common/authorization.util';
import {
  dateOnly,
  integer,
  money,
  text,
  fingerprint,
  idempotencyKey,
} from '../common/utils/input.util';
import { MoneyUtil } from '../common/utils/money.util';
import { publicProperty } from '../properties/property-view.util';
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus, NotificationType } from '@prisma/client';
import { TicketGeneratorService } from '../notifications/ticket-generator.service';
import { CloudTasksService } from '../notifications/cloud-tasks.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../notifications/email.service';
import { CommissionService } from '../commission/commission.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { EarningsService } from '../earnings/earnings.service';
import { PaymentsService } from '../payments/payments.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudTasks: CloudTasksService,
    private readonly ticketGenerator: TicketGeneratorService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly commissionService: CommissionService,
    private readonly loyaltyService: LoyaltyService,
    private readonly earningsService: EarningsService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
    @Inject(forwardRef(() => WalletService))
    private readonly walletService: WalletService,
  ) {}

  private party(dto: any) {
    if (!dto || typeof dto !== 'object' || Array.isArray(dto))
      throw new BadRequestException('Booking payload is required');
    const adults = integer(
      dto.adults ??
        (dto.guests !== undefined && dto.children === undefined
          ? dto.guests
          : 1),
      'Adults',
      1,
      1000,
    );
    const children = integer(dto.children ?? 0, 'Children', 0, 1000);
    const infants = integer(dto.infants ?? 0, 'Infants', 0, 100);
    const pets = integer(dto.pets ?? 0, 'Pets', 0, 20);
    if (
      dto.guests !== undefined &&
      integer(dto.guests, 'Guests', 1, 1000) !== adults + children
    )
      throw new BadRequestException('Guests must equal adults plus children');
    const checkIn = dateOnly(dto.checkIn, 'Check-in');
    const checkOut = dateOnly(dto.checkOut, 'Check-out');
    const today = new Date(
      new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) +
        'T00:00:00Z',
    );
    if (checkIn < today || checkOut <= checkIn)
      throw new BadRequestException(
        'Choose current or future check-in and a later check-out date',
      );
    if (checkOut.getTime() - checkIn.getTime() > 366 * 86400000)
      throw new BadRequestException('Stay cannot exceed 366 nights');
    const options = dto.options ?? {};
    if (
      !options ||
      typeof options !== 'object' ||
      Array.isArray(options) ||
      JSON.stringify(options).length > 16000
    )
      throw new BadRequestException('Invalid booking options');
    const allowed = [
      'category',
      'children',
      'infants',
      'pets',
      'pickupLocation',
      'dropLocation',
      'mileageOption',
      'addDriver',
      'insuranceOption',
      'tentType',
      'addOns',
      'campers',
    ];
    if (Object.keys(options).some((k) => !allowed.includes(k)))
      throw new BadRequestException('Unsupported booking option');
    for (const [key, count] of Object.entries({ children, infants, pets }))
      if (options[key] !== undefined && options[key] !== count)
        throw new BadRequestException(
          `${key} count does not match the booking party`,
        );
    return {
      adults,
      children,
      infants,
      pets,
      checkIn,
      checkOut,
      options,
      propertyId: text(dto.propertyId, 'Property ID'),
      roomTypeId: dto.roomTypeId ? text(dto.roomTypeId, 'Room type') : null,
    };
  }
  private calculateNights(a: Date, b: Date) {
    const nights = (b.getTime() - a.getTime()) / 86400000;
    if (!Number.isInteger(nights) || nights < 1)
      throw new BadRequestException(
        'Dates must define one or more complete calendar nights',
      );
    return nights;
  }
  private economics(property: any, room: any, selection: any, settings: any) {
    if (
      property.status !== 'ACTIVE' ||
      property.host?.hostStatus === 'SUSPENDED' ||
      property.host?.deletedAt ||
      property.hasActiveFault
    )
      throw new ConflictException('Property is unavailable for booking');
    const nights = this.calculateNights(selection.checkIn, selection.checkOut);
    if (
      nights < property.minStay ||
      (property.maxStay && nights > property.maxStay)
    )
      throw new BadRequestException(
        'Stay does not meet minimum or maximum night requirements',
      );
    if (
      selection.adults + selection.children >
      (room?.guestCapacity ?? property.maxGuests)
    )
      throw new BadRequestException('Party exceeds the selected capacity');
    if (selection.pets && !property.petsAllowed)
      throw new BadRequestException('Pets are not permitted at this property');
    if (room && room.propertyId !== property.id)
      throw new BadRequestException(
        'Room does not belong to the selected property',
      );
    const rate = money(
      Number(room?.basePrice ?? property.pricePerNight),
      'Nightly rate',
    );
    let base = 0;
    for (
      let day = new Date(selection.checkIn);
      day < selection.checkOut;
      day = new Date(day.getTime() + 86400000)
    ) {
      const weekend = [0, 6].includes(day.getUTCDay());
      if (property.availabilityScheduleType === 'WEEKENDS_ONLY' && !weekend)
        throw new BadRequestException(
          'Property is available on weekend nights only',
        );
      const daily =
        room && weekend && room.weekendPrice !== null
          ? money(Number(room.weekendPrice), 'Weekend rate')
          : weekend
            ? MoneyUtil.add(
                rate,
                MoneyUtil.percentage(
                  rate,
                  property.weekendSurchargePercent || 0,
                ),
              )
            : rate;
      base = MoneyUtil.add(base, daily);
    }
    const options = selection.options;
    const catalog = property.details?.bookingOptionCatalog || {};
    let optionAmount = 0;
    const add = (key: string) => {
      const item = catalog[key];
      if (!item || item.enabled !== true)
        throw new BadRequestException(
          `Option ${key} is not configured for this property`,
        );
      const price = money(item.price, `Option ${key} price`, true);
      if (!['PER_NIGHT', 'PER_STAY', 'PER_GUEST_NIGHT'].includes(item.billing))
        throw new BadRequestException(
          'Option pricing configuration is invalid',
        );
      optionAmount = MoneyUtil.add(
        optionAmount,
        price *
          (item.billing === 'PER_STAY' ? 1 : nights) *
          (item.billing === 'PER_GUEST_NIGHT'
            ? selection.adults + selection.children
            : 1),
      );
    };
    if (
      options.category &&
      options.category !==
        (property.type === 'RV'
          ? 'RV'
          : property.type === 'CAMPING_SITE'
            ? 'CAMPING'
            : property.category)
    )
      throw new BadRequestException(
        'Option category does not match the listing',
      );
    if (property.type === 'RV') {
      const mileage = integer(
        options.mileageOption ?? 0,
        'Mileage option',
        0,
        2,
      );
      const insurance = integer(
        options.insuranceOption ?? 0,
        'Insurance option',
        0,
        1,
      );
      if (
        options.addDriver !== undefined &&
        typeof options.addDriver !== 'boolean'
      )
        throw new BadRequestException('Driver selection must be a boolean');
      if (mileage) add(`mileage:${mileage}`);
      if (insurance) add(`insurance:${insurance}`);
      if (options.addDriver) add('driver');
      for (const key of ['pickupLocation', 'dropLocation'])
        if (options[key] !== undefined) text(options[key], key, 500);
    } else if (
      options.addDriver ||
      options.mileageOption ||
      options.insuranceOption ||
      options.pickupLocation ||
      options.dropLocation
    )
      throw new BadRequestException('RV options require an RV listing');
    if (property.type === 'CAMPING_SITE') {
      if (
        options.campers !== undefined &&
        options.campers !== selection.adults + selection.children
      )
        throw new BadRequestException('Camper count does not match the party');
      if (options.tentType)
        add(`tent:${text(options.tentType, 'Tent type', 100)}`);
      if (options.addOns !== undefined) {
        if (
          !Array.isArray(options.addOns) ||
          options.addOns.length > 20 ||
          new Set(options.addOns).size !== options.addOns.length
        )
          throw new BadRequestException('Invalid camping add-ons');
        for (const name of options.addOns)
          add(`addon:${text(name, 'Add-on', 100)}`);
      }
    } else if (options.tentType || options.addOns || options.campers)
      throw new BadRequestException('Camping options require a campsite');
    const discountPercent =
      nights >= 28
        ? property.monthlyDiscount || 0
        : nights >= 7
          ? property.weeklyDiscount || 0
          : 0;
    const subtotal = MoneyUtil.add(
      MoneyUtil.subtract(base, MoneyUtil.percentage(base, discountPercent)),
      optionAmount,
    );
    const cleaningFee = money(
      Number(property.cleaningFee || 0),
      'Cleaning fee',
      true,
    );
    const serviceFee = MoneyUtil.percentage(
      subtotal,
      settings.guestServiceFeePercent,
    );
    const taxes = MoneyUtil.percentage(serviceFee, settings.gstRatePercent);
    const total = MoneyUtil.add(
      MoneyUtil.add(subtotal, cleaningFee),
      MoneyUtil.add(serviceFee, taxes),
    );
    return {
      numberOfNights: nights,
      nightlyRate: rate,
      baseSubtotal: base,
      optionAmount,
      subtotal,
      cleaningFee,
      serviceFee,
      taxes,
      total,
      breakdown: {
        nights,
        rentPerNight: rate,
        subtotal,
        options: optionAmount,
        cleaning: cleaningFee,
        platformFee: serviceFee,
        gst: taxes,
        totalPayable: total,
      },
    };
  }
  private view(booking: any, user?: any) {
    const isPaid = ['CAPTURED', 'RELEASED'].includes(booking.payment?.status);
    const allowedAccess =
      isPaid && ['CONFIRMED', 'COMPLETED'].includes(booking.status);
    return {
      ...booking,
      isPaid,
      paymentStatus: booking.payment?.status || 'PENDING',
      guests: booking.adults + booking.children,
      confirmationCode: allowedAccess ? booking.confirmationCode : null,
      accessPin: allowedAccess ? booking.accessPin : null,
      guest: booking.guest
        ? {
            id: booking.guest.firebaseUid || booking.guest.id,
            displayName: booking.guest.displayName,
            photoUrl: booking.guest.photoUrl,
          }
        : undefined,
      property: booking.property
        ? publicProperty(
            booking.property,
            Boolean(
              isOperationsAdmin(user) ||
              user?.id === booking.property.hostId ||
              allowedAccess,
            ),
          )
        : undefined,
      payment: booking.payment
        ? {
            status: booking.payment.status,
            amount: booking.payment.amount,
            orderId: booking.payment.razorpayOrderId,
          }
        : null,
    };
  }
  async cleanupExpiredHolds(): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const expired: { id: string }[] =
        await tx.$queryRaw`SELECT id FROM "Booking" WHERE status = 'PENDING_PAYMENT' AND "createdAt" < NOW() - INTERVAL '15 minutes' ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 100`;
      for (const row of expired) {
        await tx.booking.update({
          where: { id: row.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancelledBy: 'system',
            cancellationReason: 'Payment hold expired',
          },
        });
        await tx.availabilityBlock.deleteMany({ where: { bookingId: row.id } });
        await tx.domainJob.upsert({
          where: { key: `cancelled:${row.id}` },
          create: {
            key: `cancelled:${row.id}`,
            type: 'BOOKING_CANCELLED',
            referenceId: row.id,
          },
          update: {},
        });
      }
      return expired.length;
    });
  }
  async getQuote(dto: any) {
    const selection = this.party(dto);
    const property = await this.prisma.property.findUnique({
      where: { id: selection.propertyId },
      include: { host: true },
    });
    if (!property) throw new NotFoundException('Property not found');
    const room = selection.roomTypeId
      ? await this.prisma.roomType.findUnique({
          where: { id: selection.roomTypeId },
        })
      : null;
    if (selection.roomTypeId && !room)
      throw new NotFoundException('Room not found');
    return {
      ...this.economics(
        property,
        room,
        selection,
        await this.commissionService.getSettings(),
      ),
      propertyTitle: property.title,
      roomTypeName: room?.name,
    };
  }
  private async coupon(
    tx: any,
    code: string,
    property: any,
    subtotal: number,
    guestId: string,
  ) {
    const clean = text(code, 'Coupon', 64).toUpperCase();
    await tx.$queryRaw`SELECT id FROM "Coupon" WHERE code = ${clean} FOR UPDATE`;
    const coupon = await tx.coupon.findUnique({ where: { code: clean } });
    if (
      !coupon ||
      !coupon.active ||
      coupon.validFrom > new Date() ||
      coupon.validUntil < new Date()
    )
      throw new BadRequestException('Coupon is invalid or expired');
    const used = await tx.booking.count({
      where: { couponCode: clean, status: { not: 'CANCELLED' } },
    });
    if (
      coupon.usageLimit !== null &&
      Math.max(coupon.usedCount, used) >= coupon.usageLimit
    )
      throw new BadRequestException('Coupon usage limit reached');
    if (
      coupon.applicableCategories.length &&
      !coupon.applicableCategories.includes(property.category)
    )
      throw new BadRequestException('Coupon is unavailable for this category');
    if (
      coupon.applicableCities.length &&
      !coupon.applicableCities.some(
        (c) => c.toLowerCase() === property.city.toLowerCase(),
      )
    )
      throw new BadRequestException('Coupon is unavailable in this city');
    if (
      coupon.minBookingAmount !== null &&
      subtotal < Number(coupon.minBookingAmount)
    )
      throw new BadRequestException('Coupon minimum amount is not met');
    const userUses = await tx.booking.count({
      where: { guestId, couponCode: clean, status: { not: 'CANCELLED' } },
    });
    if (userUses >= coupon.perUserLimit)
      throw new BadRequestException('Coupon per-user limit reached');
    let amount =
      coupon.type === 'PERCENTAGE'
        ? MoneyUtil.percentage(subtotal, Number(coupon.value))
        : Number(coupon.value);
    if (coupon.maxDiscount !== null)
      amount = Math.min(amount, Number(coupon.maxDiscount));
    return {
      code: clean,
      discount: MoneyUtil.round(Math.min(subtotal, Math.max(0, amount))),
    };
  }
  async createBooking(dto: any) {
    const selection = this.party(dto);
    const guestId = text(dto.guestId, 'Authenticated guest ID');
    const key = idempotencyKey(dto.idempotencyKey);
    const scopedKey = key ? `${guestId}:${key}` : null;
    const hash = fingerprint({
      ...selection,
      couponCode: dto.couponCode || null,
      walletDiscountAmount: dto.walletDiscountAmount ?? 0,
    });
    const settings = await this.commissionService.getSettings();
    await this.cleanupExpiredHolds();
    const booking = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Property" WHERE id = ${selection.propertyId} FOR UPDATE`;
      if (scopedKey) {
        const existing = await tx.booking.findUnique({
          where: { idempotencyKey: scopedKey },
          include: {
            property: { include: { images: true, host: true } },
            roomType: true,
            payment: true,
          },
        });
        if (existing) {
          if (existing.requestHash !== hash)
            throw new ConflictException(
              'Booking attempt key has different inputs',
            );
          return existing;
        }
      }
      const property = await tx.property.findUnique({
        where: { id: selection.propertyId },
        include: { host: true, images: true },
      });
      if (!property) throw new NotFoundException('Property not found');
      if (property.hostId === guestId)
        throw new BadRequestException('Hosts cannot book their own property');
      const room = selection.roomTypeId
        ? await tx.roomType.findUnique({ where: { id: selection.roomTypeId } })
        : null;
      if (selection.roomTypeId && !room)
        throw new NotFoundException('Room not found');
      const economics = this.economics(property, room, selection, settings);
      const overlap = {
        propertyId: property.id,
        checkIn: { lt: selection.checkOut },
        checkOut: { gt: selection.checkIn },
        status: {
          in: [
            BookingStatus.PENDING_PAYMENT,
            BookingStatus.PENDING_HOST_APPROVAL,
            BookingStatus.CONFIRMED,
          ],
        },
      };
      const blocked = await tx.availabilityBlock.findFirst({
        where: {
          propertyId: property.id,
          type: 'HOST_BLOCKED',
          startDate: { lt: selection.checkOut },
          endDate: { gt: selection.checkIn },
        },
      });
      if (blocked) throw new ConflictException('Dates are blocked by the host');
      const overlapping = await tx.booking.findMany({
        where: overlap,
        select: { roomTypeId: true, checkIn: true, checkOut: true },
      });
      if (!room && overlapping.length)
        throw new ConflictException('Property is already reserved');
      if (room) {
        if (overlapping.some((b) => !b.roomTypeId))
          throw new ConflictException('Whole property is reserved');
        for (
          let d = selection.checkIn;
          d < selection.checkOut;
          d = new Date(d.getTime() + 86400000)
        ) {
          if (
            overlapping.filter(
              (b) =>
                b.roomTypeId === room.id && b.checkIn <= d && b.checkOut > d,
            ).length >= room.totalRooms
          )
            throw new ConflictException('Selected room inventory is full');
        }
      }
      const coupon = dto.couponCode
        ? await this.coupon(
            tx,
            dto.couponCode,
            property,
            economics.subtotal,
            guestId,
          )
        : { code: null, discount: 0 };
      const walletDiscount = money(
        dto.walletDiscountAmount ?? 0,
        'Wallet discount',
        true,
      );
      if (walletDiscount > 0) {
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${guestId} FOR UPDATE`;
        const entries = await tx.walletEntry.findMany({
          where: { userId: guestId },
        });
        const balance = entries.reduce(
          (sum, e) =>
            sum +
            Math.round(Number(e.amount) * 100) * (e.type === 'CREDIT' ? 1 : -1),
          0,
        );
        const max = MoneyUtil.percentage(
          MoneyUtil.subtract(economics.subtotal, coupon.discount),
          10,
        );
        if (walletDiscount > max || Math.round(walletDiscount * 100) > balance)
          throw new BadRequestException(
            'Wallet discount exceeds the balance or 10% cap',
          );
      }
      const total = MoneyUtil.subtract(
        MoneyUtil.subtract(economics.total, coupon.discount),
        walletDiscount,
      );
      if (total <= 0)
        throw new BadRequestException(
          'Booking requires a positive payable amount',
        );
      const booking = await tx.booking.create({
        data: {
          propertyId: property.id,
          guestId,
          roomTypeId: room?.id,
          checkIn: selection.checkIn,
          checkOut: selection.checkOut,
          adults: selection.adults,
          children: selection.children,
          infants: selection.infants,
          pets: selection.pets,
          options: selection.options,
          nightlyRate: economics.nightlyRate,
          numberOfNights: economics.numberOfNights,
          subtotal: economics.subtotal,
          cleaningFee: economics.cleaningFee,
          serviceFee: economics.serviceFee,
          taxes: economics.taxes,
          couponCode: coupon.code,
          couponDiscount: coupon.discount,
          totalAmount: total,
          confirmationCode: crypto.randomBytes(6).toString('hex').toUpperCase(),
          idempotencyKey: scopedKey,
          requestHash: hash,
          pricingRules: settings as any,
          cancellationPolicy: property.cancellationPolicy,
          status: 'PENDING_PAYMENT',
        },
        include: {
          property: { include: { images: true, host: true } },
          roomType: true,
          payment: true,
        },
      });
      if (!room)
        await tx.availabilityBlock.create({
          data: {
            propertyId: property.id,
            bookingId: booking.id,
            startDate: selection.checkIn,
            endDate: selection.checkOut,
            type: 'BOOKED',
          },
        });
      if (walletDiscount)
        await tx.walletEntry.create({
          data: {
            userId: guestId,
            amount: walletDiscount,
            type: 'DEBIT',
            reason: 'Booking wallet discount',
            referenceId: booking.id,
          },
        });
      return booking;
    });
    return this.view(booking);
  }
  async dispatchBookingConfirmedSideEffects(booking: any) {
    if (
      booking.status !== 'CONFIRMED' ||
      !['CAPTURED', 'RELEASED'].includes(booking.payment?.status)
    )
      return;
    // Financial effects are separately idempotent; errors propagate to the durable worker.
    await this.earningsService.calculateAndCreateEarning(booking.id);
    await this.notificationsService.sendNotification(
      booking.guestId,
      NotificationType.BOOKING_CONFIRMED,
      'Booking confirmed',
      `Your stay at ${booking.property.title} is confirmed`,
      {
        bookingId: booking.id,
        eventKey: `booking-confirmed:${booking.id}:guest`,
      },
    );
    await this.notificationsService.sendNotification(
      booking.property.hostId,
      NotificationType.BOOKING_CONFIRMED,
      'New reservation',
      `A booking at ${booking.property.title} is confirmed`,
      {
        bookingId: booking.id,
        eventKey: `booking-confirmed:${booking.id}:host`,
      },
    );
    if (
      !booking.confirmationDispatchedAt &&
      booking.guest?.email &&
      booking.guest.emailVerified &&
      !booking.guest?.deletedAt &&
      (await this.notificationsService.getPreferences(booking.guest.id))
        .emailEnabled
    ) {
      const sent = await this.emailService.sendBookingConfirmationEmail({
        to: booking.guest.email,
        guestName: booking.guest.displayName || 'Guest',
        propertyTitle: booking.property.title,
        city: booking.property.city,
        checkIn: booking.checkIn.toISOString().slice(0, 10),
        checkOut: booking.checkOut.toISOString().slice(0, 10),
        confirmationCode: booking.confirmationCode,
        totalAmount: Number(booking.totalAmount),
        numberOfNights: booking.numberOfNights,
      });
      if (sent === false)
        throw new Error('Confirmation email was not delivered');
    }
    await this.prisma.booking.update({
      where: { id: booking.id },
      data: { confirmationDispatchedAt: new Date() },
    });
  }
  async hostRespond(id: string, accept: boolean, user?: any) {
    if (typeof accept !== 'boolean')
      throw new BadRequestException('accept must be a boolean');
    if (!accept) return this.cancelBooking(id, 'Declined by host', user, true);
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Booking" WHERE id = ${id} FOR UPDATE`;
      const b = await tx.booking.findUnique({
        where: { id },
        include: { property: true, payment: true },
      });
      if (!b) throw new NotFoundException('Booking not found');
      if (
        !user?.id ||
        (b.property.hostId !== user.id && !isOperationsAdmin(user))
      )
        throw new ForbiddenException('Only the host can respond');
      if (b.status === 'CONFIRMED') return this.view(b, user);
      if (
        b.status !== 'PENDING_HOST_APPROVAL' ||
        !['CAPTURED', 'RELEASED'].includes(b.payment?.status || '')
      )
        throw new ConflictException(
          'Booking is not a paid request awaiting approval',
        );
      const confirmed = await tx.booking.update({
        where: { id },
        data: { status: 'CONFIRMED' },
        include: { property: true, payment: true },
      });
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: id,
          fromStatus: b.status,
          toStatus: 'CONFIRMED',
          actorId: user.id,
          actorType: isOperationsAdmin(user) ? 'admin' : 'host',
        },
      });
      await tx.domainJob.upsert({
        where: { key: `confirmed:${id}` },
        create: {
          key: `confirmed:${id}`,
          type: 'BOOKING_CONFIRMED',
          referenceId: id,
        },
        update: {},
      });
      return this.view(confirmed, user);
    });
  }
  async cancelBooking(
    id: string,
    reason: string,
    user?: any,
    hostDecline = false,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Booking" WHERE id = ${id} FOR UPDATE`;
      const b = await tx.booking.findUnique({
        where: { id },
        include: { property: { include: { host: true } }, guest: true, payment: true },
      });
      if (!b) throw new NotFoundException('Booking not found');
      if (
        !user?.id ||
        (!isOperationsAdmin(user) &&
          b.guestId !== user.id &&
          b.property.hostId !== user.id)
      )
        throw new ForbiddenException(
          'Booking participant authorization is required',
        );
      if (
        hostDecline &&
        b.property.hostId !== user.id &&
        !isOperationsAdmin(user)
      )
        throw new ForbiddenException('Only the host can decline');
      if (b.status === 'CANCELLED') return this.view(b, user);
      if (b.status === 'COMPLETED')
        throw new ConflictException('Completed booking cannot be cancelled');
      const cancelled = await tx.booking.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: isOperationsAdmin(user)
            ? 'admin'
            : b.guestId === user.id
              ? 'guest'
              : 'host',
          cancellationReason:
            typeof reason === 'string'
              ? reason.slice(0, 2000)
              : 'Cancellation requested',
        },
        include: { property: true, payment: true },
      });
      await tx.availabilityBlock.deleteMany({ where: { bookingId: id } });
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: id,
          fromStatus: b.status,
          toStatus: 'CANCELLED',
          actorId: user.id,
          actorType: cancelled.cancelledBy || 'system',
        },
      });
      await tx.domainJob.upsert({
        where: { key: `cancelled:${id}` },
        create: {
          key: `cancelled:${id}`,
          type: 'BOOKING_CANCELLED',
          referenceId: id,
        },
        update: {},
      });

      // Dispatch cancellation email to guest & host, plus push notifications
      if (b.guest?.email) {
        this.emailService
          .sendEmail(
            b.guest.email,
            'StayQ Reservation Cancelled',
            `<div style="font-family:sans-serif;padding:24px"><h2 style="color:#DC2626">Booking Cancelled</h2><p>Hi ${b.guest.displayName || 'Guest'}, your booking for <b>${b.property.title}</b> (${b.property.city}) has been cancelled. Confirmation code: <b>${b.confirmationCode}</b>.</p></div>`,
            true,
          )
          .catch(() => {});
      }
      if (b.property?.host?.email) {
        this.emailService
          .sendEmail(
            b.property.host.email,
            'StayQ Reservation Cancelled',
            `<div style="font-family:sans-serif;padding:24px"><h2 style="color:#DC2626">Reservation Cancelled</h2><p>Hi ${b.property.host.displayName || 'Host'}, reservation #${b.confirmationCode} at <b>${b.property.title}</b> was cancelled.</p></div>`,
            true,
          )
          .catch(() => {});
      }
      this.notificationsService
        .sendNotification(
          b.guestId,
          NotificationType.BOOKING_CANCELLED,
          'Reservation Cancelled',
          `Your reservation at ${b.property.title} has been cancelled.`,
          { bookingId: id },
        )
        .catch(() => {});
      this.notificationsService
        .sendNotification(
          b.property.hostId,
          NotificationType.BOOKING_CANCELLED,
          'Booking Cancelled',
          `Reservation #${b.confirmationCode} at ${b.property.title} was cancelled.`,
          { bookingId: id },
        )
        .catch(() => {});

      return {
        ...this.view(cancelled, user),
        refundStatus: b.payment ? 'PENDING_RECONCILIATION' : 'NOT_APPLICABLE',
      };
    });
  }
  async processCancellation(booking: any, fullRefund = false) {
    await this.walletService.reverseWalletDiscount(booking.id);
    await this.loyaltyService.reverseBookingPoints(booking.guestId, booking.id);
    await this.earningsService.cancelEarning(booking.id, 'Booking cancelled');
    if (
      ['CAPTURED', 'RELEASED'].includes(booking.payment?.status) &&
      booking.payment?.razorpayOrderId
    ) {
      const hours =
        (booking.checkIn.getTime() -
          (booking.cancelledAt || new Date()).getTime()) /
        3600000;
      const policy = (booking.cancellationPolicy || '').toLowerCase();
      const percent =
        fullRefund || booking.cancelledBy !== 'guest'
          ? 100
          : policy === 'flexible'
            ? hours >= 24
              ? 100
              : 0
            : policy === 'moderate'
              ? hours >= 120
                ? 100
                : hours >= 24
                  ? 50
                  : 0
              : policy === 'strict'
                ? hours >= 168
                  ? 50
                  : 0
                : 0;
      const amount = MoneyUtil.percentage(
        Number(booking.payment.amount),
        percent,
      );
      if (amount > 0) {
        const refund = await this.paymentsService.initiateRefund({
          orderId: booking.payment.razorpayOrderId,
          refundAmount: amount,
          refundId: `cancel_${booking.id.replace(/-/g, '')}`,
          refundNote: 'Booking cancellation refund',
        });
        if (refund.status !== 'SUCCESS')
          throw new Error('Gateway refund reconciliation remains pending');
      }
    }
  }
  async updateStatus(id: string, status: string, user?: any) {
    const target = text(status, 'Booking status').toUpperCase();
    if (target === 'CANCELLED')
      return this.cancelBooking(id, 'Booking cancelled', user);
    if (target === 'CONFIRMED') return this.hostRespond(id, true, user);
    if (target !== 'COMPLETED')
      throw new BadRequestException(
        'Status can only be confirmed, cancelled or completed',
      );
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Booking" WHERE id = ${id} FOR UPDATE`;
      const b = await tx.booking.findUnique({
        where: { id },
        include: { property: true, payment: true },
      });
      if (!b) throw new NotFoundException('Booking not found');
      if (
        !user?.id ||
        (b.property.hostId !== user.id && !isOperationsAdmin(user))
      )
        throw new ForbiddenException(
          'Only the host or admin can complete a stay',
        );
      if (b.status === 'COMPLETED') return this.view(b, user);
      if (
        b.status !== 'CONFIRMED' ||
        !['CAPTURED', 'RELEASED'].includes(b.payment?.status || '') ||
        b.checkOut > new Date()
      )
        throw new ConflictException(
          'Only a paid confirmed stay after check-out can be completed',
        );
      const completed = await tx.booking.update({
        where: { id },
        data: { status: 'COMPLETED' },
        include: { property: true, payment: true },
      });
      await tx.domainJob.upsert({
        where: { key: `completed:${id}` },
        create: {
          key: `completed:${id}`,
          type: 'BOOKING_COMPLETED',
          referenceId: id,
        },
        update: {},
      });
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: id,
          fromStatus: b.status,
          toStatus: 'COMPLETED',
          actorId: user.id,
          actorType: isOperationsAdmin(user) ? 'admin' : 'host',
        },
      });
      return this.view(completed, user);
    });
  }
  private readonly include = {
    guest: true,
    property: {
      include: { images: true, host: true, availabilityBlocks: true },
    },
    payment: true,
    roomType: true,
  };
  async findAll(): Promise<any[]> {
    return (
      await this.prisma.booking.findMany({
        include: this.include,
        orderBy: { createdAt: 'desc' },
        take: 500,
      })
    ).map((b) => this.view(b, { isAdmin: true, adminRole: 'SUPER_ADMIN' }));
  }
  async findOne(id: string, user?: any) {
    const b = await this.prisma.booking.findUnique({
      where: { id },
      include: this.include,
    });
    if (!b) throw new NotFoundException('Booking not found');
    if (
      !user?.id ||
      (!isOperationsAdmin(user) &&
        b.guestId !== user.id &&
        b.property.hostId !== user.id)
    )
      throw new ForbiddenException('Access denied to booking');
    return this.view(b, user);
  }
  async getAccessDetails(id: string, user?: any) {
    const b = await this.findOne(id, user);
    if (!b.isPaid || !['CONFIRMED', 'COMPLETED'].includes(b.status))
      throw new ForbiddenException('Access requires a paid confirmed booking');
    const p = await this.prisma.property.findUniqueOrThrow({
      where: { id: b.propertyId },
      include: { host: true },
    });
    return {
      bookingId: b.id,
      confirmationCode: b.confirmationCode,
      propertyTitle: p.title,
      fullAddress: [p.address, p.city, p.state, p.country, p.pincode]
        .filter(Boolean)
        .join(', '),
      latitude: p.lat,
      longitude: p.lng,
      doorPinCode: b.accessPin || null,
      wifiNetwork: p.wifiSsid || null,
      wifiPassword: p.wifiPassword || null,
      hostName: p.host.displayName,
      hostPhone: p.host.phone,
      isStayingWithHost: p.details?.['isStayingWithHost'] === true,
      checkInInstructions:
        p.accessInstructions || 'Contact the host for check-in instructions',
      hostPresenceNotes: p.details?.['hostPresenceNotes'] || null,
    };
  }
  async getTicketPass(id: string, user?: any) {
    const b = await this.findOne(id, user);
    if (!b.isPaid || !['CONFIRMED', 'COMPLETED'].includes(b.status))
      throw new ForbiddenException(
        'A stay pass requires a paid confirmed booking',
      );
    return this.ticketGenerator.generateTicketImage(b);
  }
  async findByGuestId(guestId: string) {
    return (
      await this.prisma.booking.findMany({
        where: {
          guestId,
          status: {
            in: [
              BookingStatus.CONFIRMED,
              BookingStatus.PENDING_HOST_APPROVAL,
              BookingStatus.COMPLETED,
            ],
          },
        },
        include: this.include,
        orderBy: { createdAt: 'desc' },
        take: 500,
      })
    ).map((b) => this.view(b));
  }
  async findByHostId(hostId: string) {
    return (
      await this.prisma.booking.findMany({
        where: { property: { hostId } },
        include: this.include,
        orderBy: { createdAt: 'desc' },
        take: 500,
      })
    ).map((b) => this.view(b, { id: hostId }));
  }
  async validateCoupon(
    code: string,
    propertyId: string,
    subtotal: number,
    guestId?: string,
  ) {
    if (!guestId)
      throw new UnauthorizedException('Guest authentication is required');
    subtotal = money(subtotal, 'Subtotal');
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) throw new NotFoundException('Property not found');
    const result = await this.prisma.$transaction((tx) =>
      this.coupon(tx, code, property, subtotal, guestId),
    );
    return {
      valid: true,
      code: result.code,
      discountAmount: result.discount,
      finalPayable: MoneyUtil.subtract(subtotal, result.discount),
    };
  }
}
