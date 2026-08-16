import { Controller, Post, Body, Logger, Headers, UnauthorizedException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { TicketGeneratorService } from './ticket-generator.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly ticketGenerator: TicketGeneratorService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('reminders/night-before')
  async handleNightBeforeReminder(
    @Headers('x-cloudtasks-queuename') queueName: string,
    @Body() payload: { bookingId: string }
  ) {
    // Only allow requests from Cloud Tasks or local dev
    if (process.env.NODE_ENV === 'production' && !queueName) {
      this.logger.warn('Unauthorized Cloud Tasks webhook call attempted');
      throw new UnauthorizedException('Missing Cloud Tasks headers');
    }

    this.logger.log(`Received Night-Before webhook for booking ${payload.bookingId}`);
    
    // Fetch booking details
    const booking = await this.prisma.booking.findUnique({
      where: { id: payload.bookingId },
      include: { guest: true, property: true },
    });

    if (!booking || booking.status !== 'CONFIRMED') {
      this.logger.warn(`Booking ${payload.bookingId} not found or not confirmed.`);
      return { status: 'skipped' };
    }

    // 1. Generate PNG Ticket
    const ticketBuffer = await this.ticketGenerator.generateTicketImage(booking);
    
    // 2. Send Rich Push Notification via Firebase Cloud Messaging
    await this.notificationsService.sendRichPushNotification(
      booking.guest.firebaseUid,
      'Your Cruise Ticket is Ready! 🚢',
      `Check-in tomorrow at ${booking.property.checkInTime} for your luxury stay at ${booking.property.title}.`,
      ticketBuffer.toString('base64'),
    );

    return { status: 'success' };
  }
}
