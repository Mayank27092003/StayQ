import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getWalletBalance(userId: string) {
    const entries = await this.prisma.walletEntry.findMany({
      where: { userId },
    });

    let balance = 0;
    for (const entry of entries) {
      if (entry.type === 'CREDIT') {
        balance += Number(entry.amount);
      } else if (entry.type === 'DEBIT') {
        balance -= Number(entry.amount);
      }
    }

    return { balance };
  }

  async getWalletHistory(userId: string) {
    return this.prisma.walletEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addCredit(userId: string, amount: number, reason: string, referenceId?: string) {
    if (amount <= 0) {
      throw new BadRequestException('Credit amount must be positive');
    }

    return this.prisma.walletEntry.create({
      data: {
        user: { connect: { id: userId } },
        amount,
        type: 'CREDIT',
        reason,
        referenceId,
      },
    });
  }

  async processReferralReward(referralId: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { id: referralId },
    });

    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    if (referral.rewardClaimed) {
      throw new BadRequestException('Reward already claimed');
    }

    if (referral.status !== 'FIRST_BOOKING') {
      throw new BadRequestException('Referral must be in FIRST_BOOKING status to claim reward');
    }

    // Transaction for atomic update and wallet credit
    return this.prisma.$transaction(async (tx) => {
      // 1. Mark as claimed
      await tx.referral.update({
        where: { id: referralId },
        data: { rewardClaimed: true, status: 'REWARDED' },
      });

      // 2. Credit referrer
      await tx.walletEntry.create({
        data: {
          userId: referral.referrerId,
          amount: referral.referrerReward,
          type: 'CREDIT',
          reason: 'referral_bonus',
          referenceId: referral.id,
        },
      });

      // 3. Credit referred user (if applicable)
      if (referral.referredUserId) {
        await tx.walletEntry.create({
          data: {
            userId: referral.referredUserId,
            amount: referral.referredReward,
            type: 'CREDIT',
            reason: 'referral_bonus',
            referenceId: referral.id,
          },
        });
      }

      return { success: true };
    });
  }

  async withdraw(userId: string, amount: number, bankDetails?: any) {
    if (amount <= 0) {
      throw new BadRequestException('Withdrawal amount must be greater than 0');
    }

    const { balance } = await this.getWalletBalance(userId);
    if (balance < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    return this.prisma.walletEntry.create({
      data: {
        userId,
        amount,
        type: 'DEBIT',
        reason: 'Withdrawal to Bank Account',
        referenceId: `payout_${Date.now()}`,
      },
    });
  }

  async topUp(userId: string, amount: number, paymentId: string) {
    if (amount <= 0) {
      throw new BadRequestException('Top-up amount must be greater than 0');
    }

    return this.prisma.walletEntry.create({
      data: {
        userId,
        amount,
        type: 'CREDIT',
        reason: 'Wallet Balance Top-up',
        referenceId: paymentId,
      },
    });
  }
}
