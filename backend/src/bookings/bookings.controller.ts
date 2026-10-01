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
    createBookingDto.guestId = user.id;
    return this.bookingsService.createBooking(createBookingDto);
  }

  @Patch(':id/cancel')
  cancelBooking(@CurrentUser() user: any, @Param('id') id: string, @Body('reason') reason: string) {
    return this.bookingsService.cancelBooking(id, reason, user);
  }

  @Patch(':id/host-respond')
  hostRespond(@CurrentUser() user: any, @Param('id') id: string, @Body('accept') accept: boolean) {
    return this.bookingsService.hostRespond(id, accept, user);
  }

  @Patch(':id/status')
  updateStatus(@CurrentUser() user: any, @Param('id') id: string, @Body('status') status: string) {
    return this.bookingsService.updateStatus(id, status, user);
  }

  @Get(':id/access-details')
  getAccessDetails(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bookingsService.getAccessDetails(id, user);
  }

  @Get(':id/ticket')
  async getTicket(@CurrentUser() user: any, @Param('id') id: string) {
    const buffer = await this.bookingsService.getTicketPass(id, user);
    return {
      bookingId: id,
      ticketImageBase64: buffer.toString('base64'),
    };
  }

  @Post(':id/cancel')
  postCancelBooking(@CurrentUser() user: any, @Param('id') id: string, @Body('reason') reason: string) {
    return this.bookingsService.cancelBooking(id, reason || 'Guest requested cancellation', user);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bookingsService.findOne(id, user);
  }

  @Get()
  findAll(@CurrentUser() user: any, @Query('adminView') adminView?: string, @Query('guestId') guestId?: string) {
    // If not admin, strictly scope queries to the authenticated user's own bookings
    if (!user?.isAdmin) {
      return this.bookingsService.findByGuestId(user.id);
    }
    if (guestId) {
      return this.bookingsService.findByGuestId(guestId);
    }
    return this.bookingsService.findAll();
  }
}
