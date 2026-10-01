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

  async getUserReferralDetails(userId: string) {
    let user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, referralCode: true, displayName: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Auto-generate referral code if missing
    if (!user.referralCode) {
      const codeSuffix = user.id.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase() || Math.random().toString(36).substring(2, 8).toUpperCase();
      const code = `SQ-${codeSuffix}`;
      user = await this.prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: { id: true, referralCode: true, displayName: true, email: true },
      });
    }

    const referralCode = user.referralCode;
    const shareUrl = `https://stayq.space/?ref=${referralCode}`;

    // Get referral records
    const referrals = await this.prisma.referral.findMany({
      where: { referrerId: userId },
      include: { referredUser: { select: { id: true, displayName: true, email: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const { balance } = await this.getWalletBalance(userId);

    const totalReferrals = referrals.length;
    const successfulBookings = referrals.filter((r) => r.status === 'FIRST_BOOKING' || r.status === 'REWARDED').length;
    const totalEarned = referrals.reduce((sum, r) => sum + (r.rewardClaimed ? Number(r.referrerReward) : 0), 0);

    return {
      referralCode,
      shareUrl,
      walletBalance: balance,
      maxCheckoutDiscountPercent: 10,
      totalReferrals,
      successfulBookings,
      totalEarned,
      referrals: referrals.map((r) => ({
        id: r.id,
        userName: r.referredUser?.displayName || 'Friend',
        status: r.status,
        rewardAmount: Number(r.referrerReward),
        rewardClaimed: r.rewardClaimed,
        date: r.createdAt,
      })),
      terms: {
        baseReferrerRewardAmount: 100,
        milestone5thReferrerRewardAmount: 250,
        referredWelcomeRewardAmount: 100,
        checkoutUsageRule: 'Max 10% of booking subtotal can be redeemed per checkout.',
      },
    };
  }

  async applyReferralCode(referredUserId: string, referralCode: string) {
    const cleanCode = referralCode.trim().toUpperCase();
    const referrer = await this.prisma.user.findUnique({
      where: { referralCode: cleanCode },
    });

    if (!referrer) {
      throw new NotFoundException('Invalid referral code');
    }

    if (referrer.id === referredUserId) {
      throw new BadRequestException('You cannot refer yourself');
    }

    const existing = await this.prisma.referral.findFirst({
      where: { referredUserId },
    });

    if (existing) {
      throw new BadRequestException('You have already applied a referral code');
    }

    // Milestone rule: ₹100 per referral, ₹250 for 5th (and every 5th) referral
    const previousReferralCount = await this.prisma.referral.count({
      where: { referrerId: referrer.id },
    });
    const referralIndex = previousReferralCount + 1;
    const referrerReward = referralIndex % 5 === 0 ? 250 : 100;
    const referredReward = 100;

    const newReferral = await this.prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredUserId,
        referralCode: cleanCode,
        status: 'SIGNED_UP',
        referrerReward,
        referredReward,
      },
    });

    // Instantly credit ₹100 welcome referral bonus to the referred user's wallet
    await this.prisma.walletEntry.create({
      data: {
        userId: referredUserId,
        amount: referredReward,
        type: 'CREDIT',
        reason: 'Referral Welcome Bonus (Use up to 10% on checkout)',
        referenceId: newReferral.id,
      },
    });

    return {
      success: true,
      message: `Referral code applied! ₹${referredReward} added to your Stay Q wallet.`,
      bonusAmount: referredReward,
      referrerWillEarn: referrerReward,
      is5thMilestone: referralIndex % 5 === 0,
    };
  }

  async calculateReferralDiscount(userId: string, subtotal: number) {
    if (subtotal <= 0) {
      return {
        walletBalance: 0,
        subtotal: 0,
        maxAllowedDiscount: 0,
        appliedDiscount: 0,
        payableSubtotal: 0,
      };
    }

    const { balance } = await this.getWalletBalance(userId);
    // Strict 10% maximum cap rule on checkout
    const maxAllowedDiscount = Math.floor(subtotal * 0.10);
    const appliedDiscount = Math.min(balance, maxAllowedDiscount);

    return {
      walletBalance: balance,
      subtotal,
      maxAllowedDiscountPercent: 10,
      maxAllowedDiscount,
      appliedDiscount,
      payableSubtotal: subtotal - appliedDiscount,
      remainingWalletBalance: balance - appliedDiscount,
    };
  }

  async redeemReferralDiscount(userId: string, bookingId: string, subtotal: number, requestedDiscount: number) {
    if (requestedDiscount <= 0) return { appliedDiscount: 0 };

    const maxAllowedDiscount = Math.floor(subtotal * 0.10);
    if (requestedDiscount > maxAllowedDiscount) {
      throw new BadRequestException(
        `Referral discount exceeds 10% cap. Maximum allowed on this booking is ₹${maxAllowedDiscount}`,
      );
    }

    const { balance } = await this.getWalletBalance(userId);
    if (balance < requestedDiscount) {
      throw new BadRequestException(`Insufficient wallet balance. Available: ₹${balance}`);
    }

    await this.prisma.walletEntry.create({
      data: {
        userId,
        amount: requestedDiscount,
        type: 'DEBIT',
        reason: `Referral Discount applied on Booking (${bookingId})`,
        referenceId: bookingId,
      },
    });

    return {
      success: true,
      appliedDiscount: requestedDiscount,
      remainingBalance: balance - requestedDiscount,
    };
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
