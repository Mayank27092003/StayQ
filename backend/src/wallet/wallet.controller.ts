import { isFinanceAdmin } from '../common/authorization.util';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
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
    if (
      user.id !== userId &&
      user.firebaseUid !== userId &&
      !isFinanceAdmin(user)
    ) {
      throw new UnauthorizedException(
        'Cannot view another user wallet balance',
      );
    }
    return this.walletService.getWalletBalance(
      user.firebaseUid === userId ? user.id : userId,
    );
  }

  @Get(':userId/history')
  async getHistory(@Param('userId') userId: string, @CurrentUser() user: any) {
    if (
      user.id !== userId &&
      user.firebaseUid !== userId &&
      !isFinanceAdmin(user)
    ) {
      throw new UnauthorizedException(
        'Cannot view another user wallet history',
      );
    }
    return this.walletService.getWalletHistory(
      user.firebaseUid === userId ? user.id : userId,
    );
  }

  @Get('referral-info')
  async getReferralInfo(@CurrentUser() user: any) {
    return this.walletService.getUserReferralDetails(user.id);
  }

  @Post('apply-referral')
  async applyReferral(
    @Body() body: { referralCode: string },
    @CurrentUser() user: any,
  ) {
    return this.walletService.applyReferralCode(user.id, body.referralCode);
  }

  @Post('calculate-discount')
  async calculateDiscount(
    @Body() body: { subtotal: number },
    @CurrentUser() user: any,
  ) {
    const subtotal = Number(body.subtotal);
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      throw new BadRequestException(
        'Subtotal must be a valid non-negative number',
      );
    }
    return this.walletService.calculateReferralDiscount(user.id, subtotal);
  }

  @Post('redeem-discount')
  async redeemDiscount(
    @Body()
    body: { bookingId: string; subtotal: number; requestedDiscount: number },
    @CurrentUser() user: any,
  ) {
    const subtotal = Number(body.subtotal);
    const requestedDiscount = Number(body.requestedDiscount);
    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      throw new BadRequestException('Subtotal must be a valid positive number');
    }
    if (!Number.isFinite(requestedDiscount) || requestedDiscount <= 0) {
      throw new BadRequestException(
        'Requested discount must be a valid positive number',
      );
    }
    return this.walletService.redeemReferralDiscount(
      user.id,
      body.bookingId,
      subtotal,
      requestedDiscount,
    );
  }

  @Post('credit')
  @UseGuards(AdminGuard)
  async addCredit(
    @Body()
    body: {
      userId: string;
      amount: number;
      reason: string;
      referenceId?: string;
    },
  ) {
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Credit amount must be a positive number');
    }
    return this.walletService.addCredit(
      body.userId,
      amount,
      body.reason,
      body.referenceId,
    );
  }

  @Post('withdraw')
  async withdraw(
    @Body() body: { amount: number; bankDetails?: any },
    @CurrentUser() user: any,
  ) {
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException(
        'Withdrawal amount must be a positive number',
      );
    }
    return this.walletService.withdraw(user.id, amount, body.bankDetails);
  }

  @Post('topup')
  async topUp(
    @Body() body: { amount: number; paymentId: string; orderId?: string },
    @CurrentUser() user: any,
  ) {
    if (!body.paymentId && !body.orderId) {
      throw new UnauthorizedException(
        'Payment ID or Order ID is required for wallet topup',
      );
    }
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Top-up amount must be a positive number');
    }
    return this.walletService.topUp(
      user.id,
      amount,
      body.paymentId,
      body.orderId,
    );
  }

  @Post('referral/:id/claim')
  async claimReferralReward(
    @Param('id') referralId: string,
    @CurrentUser() user: any,
  ) {
    return this.walletService.processReferralReward(referralId, user.id);
  }
}
