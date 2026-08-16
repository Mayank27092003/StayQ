import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminGuard } from '../guards/admin.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminRoles } from '../decorators/admin-roles.decorator';
import { AdminBookingsService } from './admin-bookings.service';
import {
  AdminBookingQueryDto,
  CancelBookingDto,
  CompleteBookingDto,
  ConfirmBookingDto,
  CreateRefundDto,
} from './dto/admin-booking.dto';

@ApiTags('Admin / Bookings')
@ApiBearerAuth()
@Controller('admin/bookings')
@UseGuards(FirebaseAuthGuard, AdminGuard, AdminRolesGuard)
export class AdminBookingsController {
  constructor(private readonly bookings: AdminBookingsService) {}

  @Get()
  @ApiOperation({ summary: 'List bookings with filters' })
  list(@Query() query: AdminBookingQueryDto) {
    return this.bookings.list(query);
  }

  @Get('refund-capability')
  @ApiOperation({ summary: 'Whether the payment gateway is configured for refunds' })
  refundCapability() {
    return this.bookings.refundCapability();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Booking detail with payment, refunds, and status timeline' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookings.findOne(id);
  }

  @Post(':id/confirm')
  @AdminRoles(AdminRole.OPERATIONS)
  @ApiOperation({ summary: 'Confirm a pending booking' })
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmBookingDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.bookings.confirm(id, dto, adminId);
  }

  @Post(':id/cancel')
  @AdminRoles(AdminRole.OPERATIONS, AdminRole.TRUST_SAFETY)
  @ApiOperation({ summary: 'Cancel a booking and release its blocked dates' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBookingDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.bookings.cancel(id, dto, adminId);
  }

  @Post(':id/complete')
  @AdminRoles(AdminRole.OPERATIONS)
  @ApiOperation({ summary: 'Mark a stay complete after its check-out date' })
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteBookingDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.bookings.complete(id, dto, adminId);
  }

  @Post(':id/refunds')
  @AdminRoles(AdminRole.FINANCE)
  @ApiOperation({ summary: 'Issue a real gateway refund and record it' })
  refund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateRefundDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.bookings.refund(id, dto, adminId);
  }
}
