import { isOperationsAdmin } from '../common/authorization.util';
import {
  Controller,
  Post,
  Body,
  Param,
  Patch,
  Get,
  Query,
  UseGuards,
  Headers,
  Put,
  Delete,
} from '@nestjs/common';
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

  @Post('validate-coupon')
  validateCoupon(
    @CurrentUser() user: any,
    @Body() body: { code: string; propertyId: string; subtotal: number },
  ) {
    return this.bookingsService.validateCoupon(
      body.code,
      body.propertyId,
      Number(body.subtotal),
      user?.id,
    );
  }

  @Post()
  createBooking(
    @CurrentUser() user: any,
    @Body() dto: any,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.bookingsService.createBooking({
      ...dto,
      guestId: user.id,
      idempotencyKey: key || dto.idempotencyKey,
    });
  }

  @Patch(':id/cancel')
  cancelBooking(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.bookingsService.cancelBooking(id, reason, user);
  }

  @Patch(':id/host-respond')
  hostRespond(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('accept') accept: boolean,
  ) {
    return this.bookingsService.hostRespond(id, accept, user);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
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
  postCancelBooking(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.bookingsService.cancelBooking(
      id,
      reason || 'Guest requested cancellation',
      user,
    );
  }

  @Get('my-bookings')
  myBookings(@CurrentUser() user: any) {
    return this.bookingsService.findByGuestId(user.id);
  }

  @Get('host-bookings')
  hostBookings(@CurrentUser() user: any) {
    return this.bookingsService.findByHostId(user.id);
  }

  @Put(':id/status')
  putStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.bookingsService.updateStatus(id, status, user);
  }

  @Delete(':id')
  deleteBooking(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bookingsService.cancelBooking(
      id,
      'Guest requested cancellation',
      user,
    );
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bookingsService.findOne(id, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('adminView') adminView?: string,
    @Query('guestId') guestId?: string,
  ) {
    // If not admin, strictly scope queries to the authenticated user's own bookings
    if (!isOperationsAdmin(user)) {
      return this.bookingsService.findByGuestId(user.id);
    }
    if (guestId) {
      return this.bookingsService.findByGuestId(guestId);
    }
    return this.bookingsService.findAll();
  }
}
