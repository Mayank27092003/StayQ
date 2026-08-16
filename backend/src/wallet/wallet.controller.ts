import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@Controller('wallet')
@UseGuards(FirebaseAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get(':userId/balance')
  async getBalance(@Param('userId') userId: string) {
    return this.walletService.getWalletBalance(userId);
  }

  @Get(':userId/history')
  async getHistory(@Param('userId') userId: string) {
    return this.walletService.getWalletHistory(userId);
  }

  @Post('credit')
  async addCredit(@Body() body: { userId: string; amount: number; reason: string; referenceId?: string }) {
    return this.walletService.addCredit(body.userId, body.amount, body.reason, body.referenceId);
  }

  @Post('withdraw')
  async withdraw(@Body() body: { userId: string; amount: number; bankDetails?: any }) {
    return this.walletService.withdraw(body.userId, body.amount, body.bankDetails);
  }

  @Post('topup')
  async topUp(@Body() body: { userId: string; amount: number; paymentId: string }) {
    return this.walletService.topUp(body.userId, body.amount, body.paymentId);
  }

  @Post('referral/:id/claim')
  async claimReferralReward(@Param('id') referralId: string) {
    return this.walletService.processReferralReward(referralId);
  }
}
