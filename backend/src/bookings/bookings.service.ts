import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';
import { TicketGeneratorService } from '../notifications/ticket-generator.service';
import { CloudTasksService } from '../notifications/cloud-tasks.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../notifications/email.service';
import { CommissionService } from '../commission/commission.service';
import { LoyaltyService } from '../loyalty/loyalty.service';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudTasks: CloudTasksService,
    private readonly ticketGenerator: TicketGeneratorService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly commissionService: CommissionService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  async getQuote(quoteDto: any) {
    const { propertyId, checkIn, checkOut } = quoteDto;
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
      throw new BadRequestException('Check-out date must be strictly after check-in date');
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const numberOfNights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / msPerDay));
    
    // Read live commission settings from database
    const settings = await this.commissionService.getSettings();
    const nightlyRate = Number(property.pricePerNight);
    const cleaningFee = Number(property.cleaningFee || 0);
    const subtotal = nightlyRate * numberOfNights;
    const serviceFee = Math.round(subtotal * (settings.guestServiceFeePercent / 100));
    const taxes = Math.round(serviceFee * (settings.gstRatePercent / 100));
    const total = subtotal + serviceFee + cleaningFee + taxes;
    
    return {
      subtotal,
      cleaningFee,
      serviceFee,
      taxes,
      total,
      numberOfNights,
      nightlyRate,
      appliedCommissionRates: {
        guestServiceFeePercent: settings.guestServiceFeePercent,
        gstRatePercent: settings.gstRatePercent,
        hostCommissionPercent: settings.hostCommissionPercent,
      },
      breakdown: {
        rentPerNight: nightlyRate,
        nights: numberOfNights,
        cleaning: cleaningFee,
        platformFee: serviceFee,
        gst: taxes,
        totalPayable: total,
      },
    };
  }

  async createBooking(createBookingDto: any) {
    const { propertyId, guestId, checkIn, checkOut, adults = 1, children = 0 } = createBookingDto;
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
      throw new BadRequestException('Check-out date must be strictly after check-in date');
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const numberOfNights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / msPerDay));

    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');

    const settings = await this.commissionService.getSettings();
    const nightlyRate = Number(property.pricePerNight);
    const cleaningFee = Number(property.cleaningFee || 0);
    const subtotal = nightlyRate * numberOfNights;
    const serviceFee = Math.round(subtotal * (settings.guestServiceFeePercent / 100));
    const taxes = Math.round(serviceFee * (settings.gstRatePercent / 100));
    const totalAmount = subtotal + serviceFee + cleaningFee + taxes;

    const confirmationCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const booking = await this.prisma.$transaction(async (tx) => {
      // PESSIMISTIC LOCK: Lock property row in PostgreSQL to serialize concurrent reservations
      await tx.$executeRaw`SELECT id FROM "Property" WHERE id = ${propertyId} FOR UPDATE`;

      const overlapping = await tx.availabilityBlock.findFirst({
        where: {
          propertyId,
          AND: [
            { startDate: { lt: checkOutDate } },
            { endDate: { gt: checkInDate } }
          ]
        }
      });

      if (overlapping) {
        throw new BadRequestException('Dates are not available');
      }

      const newBooking = await tx.booking.create({
        data: {
          propertyId,
          guestId,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          adults,
          children,
          nightlyRate,
          numberOfNights,
          subtotal,
          cleaningFee,
          serviceFee,
          totalAmount,
          confirmationCode,
          status: BookingStatus.PENDING_PAYMENT,
        },
        include: { guest: true, property: true }
      });

      await tx.availabilityBlock.create({
        data: {
          propertyId,
          bookingId: newBooking.id,
          startDate: checkInDate,
          endDate: checkOutDate,
          type: 'BOOKED',
        }
      });

      return newBooking;
    });

    const ticketBuffer = await this.ticketGenerator.generateTicketImage(booking);

    await this.notificationsService.sendRichPushNotification(
      booking.guest.firebaseUid,
      'Booking Confirmed! 🎉',
      `Your luxury stay at ${booking.property.title} is confirmed. Tap to view your Digital Stay Pass!`,
      ticketBuffer.toString('base64'),
    );

    if (booking.guest.email) {
      await this.emailService.sendBookingConfirmationEmail({
        to: booking.guest.email,
        guestName: booking.guest.displayName || 'Guest',
        propertyTitle: booking.property.title,
        city: booking.property.city || 'Goa',
        checkIn: checkInDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
        checkOut: checkOutDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
        confirmationCode,
        totalAmount,
        numberOfNights: Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))),
      });
    }

    const scheduledTime = new Date(checkInDate.getTime() - 24 * 60 * 60 * 1000);
    const webhookUrl = `${process.env.PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/webhooks/reminders/night-before`;
    await this.cloudTasks.scheduleWebhook(webhookUrl, { bookingId: booking.id }, scheduledTime);

    // ─── Stay Q Rewards: Award Booking Points & Check Repeat Stay ───
    try {
      await this.loyaltyService.awardBookingPoints(
        guestId,
        booking.id,
        Number(totalAmount),
      );

      // Check if repeat stay at this property
      const pastBookingsCount = await this.prisma.booking.count({
        where: {
          guestId,
          propertyId,
          id: { not: booking.id },
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
        },
      });

      if (pastBookingsCount > 0) {
        await this.loyaltyService.awardRepeatStayPoints(
          guestId,
          booking.id,
          booking.property?.title || 'this property',
        );
      }
    } catch (e) {
      // Non-blocking for booking flow
    }

    return booking;
  }

  async cancelBooking(id: string, reason: string, user?: any) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (user && booking.guestId !== user.id && !user.isAdmin) {
      throw new ForbiddenException('Only the booking guest or an admin can cancel this booking');
    }
    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED, cancellationReason: reason, cancelledAt: new Date() },
    });
  }

  async hostRespond(id: string, accept: boolean, user?: any) {
    const booking = await this.prisma.booking.findUnique({ where: { id }, include: { property: true } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (user && booking.property?.hostId !== user.id && !user.isAdmin) {
      throw new ForbiddenException('Only the property host can accept or decline bookings');
    }
    return this.prisma.booking.update({
      where: { id },
      data: { status: accept ? BookingStatus.CONFIRMED : BookingStatus.CANCELLED },
    });
  }

  async updateStatus(id: string, status: string, user?: any) {
    const booking = await this.prisma.booking.findUnique({ where: { id }, include: { property: true } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (user && booking.property?.hostId !== user.id && !user.isAdmin) {
      throw new ForbiddenException('Only the property host or admin can update status');
    }
    return this.prisma.booking.update({
      where: { id },
      data: { status: status as BookingStatus },
    });
  }

  async findAll(): Promise<any[]> {
    return this.prisma.booking.findMany({
      include: {
        guest: true,
        property: {
          include: { images: true, host: true },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user?: any) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        guest: true,
        property: {
          include: { images: true, host: true },
        },
        payment: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (user && booking.guestId !== user.id && booking.property?.hostId !== user.id && !user.isAdmin) {
      throw new ForbiddenException('Access denied to booking details');
    }
    return booking;
  }

  async getAccessDetails(id: string, user?: any) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          include: { host: true },
        },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (user && booking.guestId !== user.id && booking.property?.hostId !== user.id && !user.isAdmin) {
      throw new ForbiddenException('Access denied to property access details');
    }

    const property = booking.property;
    const isStayingWithHost = (property as any).isStayingWithHost ?? false;
    const checkInType = property.checkInType || (isStayingWithHost ? 'HOST_GREETING' : 'SELF_CHECKIN');
    const hostName = property.host?.displayName || 'Stay Q Host';
    const hostPhone = property.host?.phone || '';

    // 1. Dynamic Door PIN: Generated uniquely per booking for smart lock self check-in
    let doorPinCode: string;
    if (checkInType === 'HOST_GREETING' || isStayingWithHost) {
      doorPinCode = 'IN-PERSON CHECK-IN';
    } else if (checkInType === 'CARETAKER') {
      doorPinCode = 'CARETAKER KEY HANDOVER';
    } else {
      // Deterministic 4-digit code generated uniquely from booking ID + confirmation code
      const hash = crypto.createHash('sha256').update(`${booking.id}_${booking.confirmationCode}`).digest('hex');
      const numericPin = (parseInt(hash.slice(0, 8), 16) % 9000 + 1000).toString();
      doorPinCode = `${numericPin}#`;
    }

    // 2. Dynamic Wi-Fi: Derived from property title & city if Wi-Fi amenity is enabled
    const hasWifi = (property.amenities || []).some(a => a.toLowerCase().includes('wifi') || a.toLowerCase().includes('wi-fi'));
    const safeTitle = property.title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    const safeCity = (property.city || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6);
    const wifiNetwork = hasWifi ? `StayQ_${safeTitle || 'Guest'}${safeCity ? '_' + safeCity : ''}` : 'No Wi-Fi listed';
    const wifiPassword = hasWifi ? `SQ@${booking.confirmationCode.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}` : 'N/A';

    // 3. Dynamic Address
    const addressParts = [
      property.address,
      property.city,
      property.state,
      property.country,
      property.pincode,
    ].filter(Boolean);
    const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : `${property.city}, ${property.country}`;

    // 4. Dynamic Host Presence Notes
    let hostPresenceNotes = '';
    if (isStayingWithHost) {
      hostPresenceNotes = `Hosted stay with ${hostName}. You have a private room with shared access to common living spaces.`;
    } else {
      const typeLabel = (property.type || 'property').toString().toLowerCase().replace(/_/g, ' ');
      hostPresenceNotes = `Entire ${typeLabel} exclusively reserved for you with full privacy.`;
    }
    if (property.isInsideGatedSociety) {
      hostPresenceNotes += ' Property is situated inside a gated residential community with 24/7 security.';
    }

    // 5. Dynamic Check-in Instructions
    const checkInTime = property.checkInTime || '14:00';
    const checkOutTime = property.checkOutTime || '11:00';
    let checkInInstructions = '';

    if (property.type === 'RV') {
      const pickup = property.pickupLocation || property.address;
      const drop = property.dropLocation || pickup;
      checkInInstructions = `RV Key Handover: Collect keys from ${hostName} at ${pickup}. Check-in from ${checkInTime}. Return vehicle by ${checkOutTime} at ${drop}.`;
    } else if (property.type === 'CAMPING_SITE') {
      checkInInstructions = `Campsite check-in: Report to the campsite reception in ${property.city}. Pitches available from ${checkInTime}. Check-out by ${checkOutTime}.`;
    } else if (checkInType === 'HOST_GREETING' || isStayingWithHost) {
      checkInInstructions = `Host Greeting: ${hostName} will welcome you at the property. Please message your ETA via Stay Q chat. Check-in starts at ${checkInTime}, check-out by ${checkOutTime}.`;
    } else if (checkInType === 'CARETAKER') {
      checkInInstructions = `Caretaker Check-in: On-site caretaker will welcome you and assist with luggage and key handover from ${checkInTime}. Check-out by ${checkOutTime}.`;
    } else {
      checkInInstructions = `Smart lock self check-in: Enter your unique booking PIN ${doorPinCode} on the keypad at the entrance door, followed by pressing the handle. Available after ${checkInTime}. Check-out by ${checkOutTime}.`;
    }
    if (property.houseRules) {
      checkInInstructions += ` House rules: ${property.houseRules}`;
    }

    // 6. Dynamic Directions
    let directions = `Navigate to ${fullAddress}`;
    if (property.lat && property.lng) {
      directions += `. GPS Coordinates: ${property.lat.toFixed(5)}, ${property.lng.toFixed(5)} (tap Directions in Stay Q app to open in Google Maps).`;
    }

    return {
      bookingId: booking.id,
      confirmationCode: booking.confirmationCode,
      propertyTitle: property.title,
      fullAddress,
      latitude: property.lat ?? (property as any).latitude ?? 0,
      longitude: property.lng ?? (property as any).longitude ?? 0,
      doorPinCode,
      wifiNetwork,
      wifiPassword,
      hostName,
      hostPhone,
      isStayingWithHost,
      hostPresenceNotes,
      checkInInstructions,
      directions,
    };
  }

  async getTicketPass(id: string, user?: any) {
    const booking = await this.findOne(id, user);
    if (!booking) throw new NotFoundException('Booking not found');
    return this.ticketGenerator.generateTicketImage(booking);
  }

  async findByGuestId(guestId: string) {
    return this.prisma.booking.findMany({
      where: { guestId },
      include: {
        property: {
          include: { images: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
