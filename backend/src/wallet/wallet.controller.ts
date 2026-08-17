import { Controller, Get, Post, Body, Param, UseGuards, UnauthorizedException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('wallet')
@UseGuards(FirebaseAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get(':userId/balance')
  async getBalance(@Param('userId') userId: string, @CurrentUser() user: any) {
    if (user.id !== userId && !user.isAdmin) {
      throw new UnauthorizedException('Cannot view another user wallet balance');
    }
    return this.walletService.getWalletBalance(userId);
  }

  @Get(':userId/history')
  async getHistory(@Param('userId') userId: string, @CurrentUser() user: any) {
    if (user.id !== userId && !user.isAdmin) {
      throw new UnauthorizedException('Cannot view another user wallet history');
    }
    return this.walletService.getWalletHistory(userId);
  }

  @Post('credit')
  @UseGuards(AdminGuard)
  async addCredit(@Body() body: { userId: string; amount: number; reason: string; referenceId?: string }) {
    return this.walletService.addCredit(body.userId, body.amount, body.reason, body.referenceId);
  }

  @Post('withdraw')
  async withdraw(@Body() body: { userId: string; amount: number; bankDetails?: any }, @CurrentUser() user: any) {
    if (user.id !== body.userId && !user.isAdmin) {
      throw new UnauthorizedException('Cannot withdraw from another user wallet');
    }
    return this.walletService.withdraw(body.userId, body.amount, body.bankDetails);
  }

  @Post('topup')
  async topUp(@Body() body: { userId: string; amount: number; paymentId: string }, @CurrentUser() user: any) {
    return this.walletService.topUp(body.userId || user.id, body.amount, body.paymentId);
  }

  @Post('referral/:id/claim')
  async claimReferralReward(@Param('id') referralId: string) {
    return this.walletService.processReferralReward(referralId);
  }
}
