import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';
import { TicketGeneratorService } from '../notifications/ticket-generator.service';
import { CloudTasksService } from '../notifications/cloud-tasks.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../notifications/email.service';
import { CommissionService } from '../commission/commission.service';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudTasks: CloudTasksService,
    private readonly ticketGenerator: TicketGeneratorService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly commissionService: CommissionService,
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
      `Your luxury stay at ${booking.property.title} is confirmed. Tap to view your Cruise Ticket!`,
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

    return booking;
  }

  async cancelBooking(id: string, reason: string) {
    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED, cancellationReason: reason, cancelledAt: new Date() },
    });
  }

  async hostRespond(id: string, accept: boolean) {
    return this.prisma.booking.update({
      where: { id },
      data: { status: accept ? BookingStatus.CONFIRMED : BookingStatus.CANCELLED },
    });
  }

  async updateStatus(id: string, status: string) {
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

  async findOne(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: {
        guest: true,
        property: {
          include: { images: true, host: true },
        },
        payment: true,
      },
    });
  }

  async getAccessDetails(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          include: { host: true },
        },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const property = booking.property;
    const isStayingWithHost = (property as any).isStayingWithHost ?? false;

    return {
      bookingId: booking.id,
      confirmationCode: booking.confirmationCode,
      propertyTitle: property.title,
      fullAddress: property.address || `${property.city}, ${property.country}`,
      latitude: (property as any).latitude ?? (property as any).lat ?? 0,
      longitude: (property as any).longitude ?? (property as any).lng ?? 0,
      doorPinCode: '8492#',
      wifiNetwork: 'StayQ-Guest',
      wifiPassword: 'explore2026',
      hostName: property.host?.displayName || 'Stay Q Host',
      hostPhone: property.host?.phone || '+91 98765 43210',
      isStayingWithHost,
      hostPresenceNotes: isStayingWithHost
        ? 'Host resides on premises in private master suite. Guest enjoys full private room with shared lounge & kitchen access.'
        : 'Entire property reserved for guest. Full private access.',
      checkInInstructions: 'Self check-in via smart lock. Enter 8492# followed by lock handle press.',
      directions: 'Take the main access road towards the estate entrance. Free parking on site.',
    };
  }

  async getTicketPass(id: string) {
    const booking = await this.findOne(id);
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
