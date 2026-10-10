import { isFinanceAdmin } from '../common/authorization.util';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { EarningsService } from './earnings.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('earnings')
@UseGuards(FirebaseAuthGuard)
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) {}

  @Get('host/:hostId')
  async getHostEarnings(
    @CurrentUser() user: any,
    @Param('hostId') hostId: string,
  ) {
    if (
      user.id !== hostId &&
      user.firebaseUid !== hostId &&
      !isFinanceAdmin(user)
    ) {
      throw new ForbiddenException('Access denied to host earnings');
    }
    return this.earningsService.getHostEarnings(
      user.firebaseUid === hostId ? user.id : hostId,
    );
  }

  @Post('calculate/:bookingId')
  @UseGuards(AdminGuard)
  async calculateEarnings(@Param('bookingId') bookingId: string) {
    return this.earningsService.calculateAndCreateEarning(bookingId);
  }

  @Post('payout/:earningId/release')
  @UseGuards(AdminGuard)
  async releasePayout(
    @CurrentUser('id') adminId: string,
    @Param('earningId') earningId: string,
    @Body() body: { reference: string; transferCompleted: boolean },
  ) {
    return this.earningsService.releasePayout(
      earningId,
      body.reference,
      body.transferCompleted,
      adminId,
    );
  }
}
