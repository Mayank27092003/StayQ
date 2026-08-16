import { Controller, Post, Body, Param, Patch, Get, Query, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('bookings')
@UseGuards(FirebaseAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('quote')
  getQuote(@Body() quoteDto: any) {
    return this.bookingsService.getQuote(quoteDto);
  }

  @Post()
  createBooking(@CurrentUser() user: any, @Body() createBookingDto: any) {
    // Assuming createBookingDto doesn't already have guestId, we might inject it or let the service do it.
    // Let's pass user.id if necessary, or just rely on DTO. Better to enforce user.id.
    createBookingDto.guestId = user.id;
    return this.bookingsService.createBooking(createBookingDto);
  }

  @Patch(':id/cancel')
  cancelBooking(@Param('id') id: string, @Body('reason') reason: string) {
    return this.bookingsService.cancelBooking(id, reason);
  }

  @Patch(':id/host-respond')
  hostRespond(@Param('id') id: string, @Body('accept') accept: boolean) {
    return this.bookingsService.hostRespond(id, accept);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.bookingsService.updateStatus(id, status);
  }

  @Get(':id/access-details')
  getAccessDetails(@Param('id') id: string) {
    return this.bookingsService.getAccessDetails(id);
  }

  @Get(':id/ticket')
  async getTicket(@Param('id') id: string) {
    const buffer = await this.bookingsService.getTicketPass(id);
    return {
      bookingId: id,
      ticketImageBase64: buffer.toString('base64'),
    };
  }

  @Post(':id/cancel')
  postCancelBooking(@Param('id') id: string, @Body('reason') reason: string) {
    return this.bookingsService.cancelBooking(id, reason || 'Guest requested cancellation');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Get()
  findAll(@CurrentUser() user: any, @Query('adminView') adminView?: string, @Query('guestId') guestId?: string) {
    if (guestId) {
      return this.bookingsService.findByGuestId(guestId);
    }
    if (user?.id && adminView !== 'true') {
      return this.bookingsService.findByGuestId(user.id);
    }
    return this.bookingsService.findAll();
  }
}
