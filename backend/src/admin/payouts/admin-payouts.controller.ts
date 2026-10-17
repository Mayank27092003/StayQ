import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminPayoutsService } from './admin-payouts.service';

@ApiTags('Admin / Payouts & Escrow')
@ApiBearerAuth()
@Controller('admin/payouts')
@UseGuards(FirebaseAuthGuard, AdminGuard)
export class AdminPayoutsController {
  constructor(private readonly payoutsService: AdminPayoutsService) {}

  @Get('escrow')
  @ApiOperation({ summary: 'Get list of host payouts in 24h check-in escrow' })
  async getEscrowPayouts(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.payoutsService.getEscrowPayouts({ status, search });
  }

  @Post(':bookingId/release')
  @ApiOperation({ summary: 'Manually release escrow payout to host bank account' })
  async releaseEscrow(
    @Param('bookingId') bookingId: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.payoutsService.releaseEscrow(bookingId, adminId);
  }

  @Post(':bookingId/hold')
  @ApiOperation({ summary: 'Place escrow payout on hold due to dispute or investigation' })
  async holdEscrow(
    @Param('bookingId') bookingId: string,
    @Body('reason') reason: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.payoutsService.holdEscrow(bookingId, reason, adminId);
  }
}
