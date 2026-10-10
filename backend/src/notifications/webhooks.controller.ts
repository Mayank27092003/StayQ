import { Public } from '../common/decorators/public.decorator';
import { timingSafeEqual } from 'crypto';
import {
  Controller,
  Post,
  Body,
  Logger,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
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

  @Public()
  @Post('reminders/night-before')
  async handleNightBeforeReminder(
    @Headers('x-cloudtasks-queuename') queueName: string,
    @Headers('x-stayq-task-secret') taskSecret: string,
    @Body() payload: { bookingId: string },
  ) {
    const expectedSecret = process.env.CLOUD_TASKS_SECRET;
    if (
      !expectedSecret ||
      expectedSecret.length < 32 ||
      !taskSecret ||
      Buffer.byteLength(taskSecret) !== Buffer.byteLength(expectedSecret) ||
      !timingSafeEqual(Buffer.from(taskSecret), Buffer.from(expectedSecret))
    )
      throw new UnauthorizedException('Invalid task authentication');

    this.logger.log(
      `Received Night-Before webhook for booking ${payload.bookingId}`,
    );

    // Fetch booking details
    const booking = await this.prisma.booking.findUnique({
      where: { id: payload.bookingId },
      include: { guest: true, property: true, payment: true },
    });

    if (
      !booking ||
      booking.status !== 'CONFIRMED' ||
      !['CAPTURED', 'RELEASED'].includes(booking.payment?.status || '')
    ) {
      this.logger.warn(
        `Booking ${payload.bookingId} not found or not confirmed.`,
      );
      return { status: 'skipped' };
    }

    await this.notificationsService.sendNotification(
      booking.guestId,
      'BOOKING_CONFIRMED',
      'Check-in reminder',
      `Your stay at ${booking.property.title} starts tomorrow`,
      { bookingId: booking.id, eventKey: `reminder:${booking.id}` },
    );

    return { status: 'success' };
  }
}
