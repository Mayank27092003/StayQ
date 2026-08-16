import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { EarningsService } from './earnings.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@Controller('earnings')
@UseGuards(FirebaseAuthGuard)
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) {}

  @Get('host/:hostId')
  async getHostEarnings(@Param('hostId') hostId: string) {
    return this.earningsService.getHostEarnings(hostId);
  }

  @Post('calculate/:bookingId')
  async calculateEarnings(@Param('bookingId') bookingId: string) {
    return this.earningsService.calculateAndCreateEarning(bookingId);
  }

  @Post('payout/:earningId/release')
  async releasePayout(
    @Param('earningId') earningId: string,
    @Body() body: { reference: string },
  ) {
    return this.earningsService.releasePayout(earningId, body.reference);
  }
}
