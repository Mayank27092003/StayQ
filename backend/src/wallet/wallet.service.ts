import { MoneyUtil } from '../common/utils/money.util';
import { money, text } from '../common/utils/input.util';
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import * as crypto from 'crypto';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => LoyaltyService))
    private readonly loyaltyService: LoyaltyService,
  ) {}

  async getWalletBalance(userId: string) {
    const entries = await this.prisma.walletEntry.findMany({
      where: { userId },
    });

    const paise = entries.reduce(
      (n, e) =>
        n +
        MoneyUtil.toPaise(e.amount.toString()) * (e.type === 'CREDIT' ? 1 : -1),
      0,
    );
    return { balance: MoneyUtil.toRupees(paise) };
  }

  async getWalletHistory(userId: string) {
    return this.prisma.walletEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addCredit(
    userId: string,
    amount: number,
    reason: string,
    referenceId?: string,
  ) {
    amount = money(amount, 'Credit amount');
    const ref = text(referenceId, 'Credit reference', 128);
    reason = text(reason, 'Credit reason', 1000);
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id=${userId} FOR UPDATE`;
      const existing = await tx.walletEntry.findFirst({
        where: { userId, referenceId: ref, type: 'CREDIT' },
      });
      if (existing) {
        if (Number(existing.amount) !== amount || existing.reason !== reason)
          throw new ConflictException(
            'Credit reference has conflicting inputs',
          );
        return existing;
      }
      return tx.walletEntry.create({
        data: { userId, amount, reason, referenceId: ref, type: 'CREDIT' },
      });
    });
  }

  async processReferralReward(id: string, claimantUserId?: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const row = await tx.referral.findUnique({ where: { id } });
      if (!row) throw new NotFoundException('Referral not found');
      if (
        claimantUserId &&
        row.referrerId !== claimantUserId &&
        row.referredUserId !== claimantUserId
      )
        throw new ForbiddenException('Not a referral participant');
      await tx.$queryRaw`SELECT id FROM "User" WHERE id=${row.referrerId} FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM "Referral" WHERE id=${id} FOR UPDATE`;
      const current = await tx.referral.findUniqueOrThrow({ where: { id } });
      if (current.rewardClaimed) return current;
      const stay = await tx.booking.findFirst({
        where: {
          guestId: current.referredUserId || '',
          status: 'COMPLETED',
          payment: { status: { in: ['CAPTURED', 'RELEASED'] } },
        },
      });
      if (!stay)
        throw new ConflictException(
          'Referral reward requires a completed paid stay',
        );
      const count = await tx.referral.count({
        where: { referrerId: current.referrerId, rewardClaimed: true },
      });
      const reward = (count + 1) % 5 === 0 ? 250 : 100;
      const updated = await tx.referral.update({
        where: { id },
        data: {
          status: 'REWARDED',
          rewardClaimed: true,
          referrerReward: reward,
        },
      });
      await tx.walletEntry.create({
        data: {
          userId: current.referrerId,
          amount: reward,
          type: 'CREDIT',
          referenceId: id,
          reason: 'Referral reward',
        },
      });
      if (
        current.referredUserId &&
        !(await tx.walletEntry.findFirst({
          where: {
            userId: current.referredUserId,
            referenceId: id,
            type: 'CREDIT',
          },
        }))
      )
        await tx.walletEntry.create({
          data: {
            userId: current.referredUserId,
            amount: current.referredReward,
            type: 'CREDIT',
            referenceId: id,
            reason: 'Completed referral welcome reward',
          },
        });
      return updated;
    });
    await this.loyaltyService.awardReferralPoints(result.referrerId, id);
    return { success: true };
  }

  async getUserReferralDetails(userId: string) {
    let user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, referralCode: true, displayName: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.referralCode)
      user = await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "User" WHERE id=${userId} FOR UPDATE`;
        const current = await tx.user.findUniqueOrThrow({
          where: { id: userId },
          select: {
            id: true,
            referralCode: true,
            displayName: true,
            email: true,
          },
        });
        return current.referralCode
          ? current
          : tx.user.update({
              where: { id: userId },
              data: {
                referralCode:
                  'SQ-' + crypto.randomBytes(6).toString('hex').toUpperCase(),
              },
              select: {
                id: true,
                referralCode: true,
                displayName: true,
                email: true,
              },
            });
      });

    const referralCode = user.referralCode;
    const shareUrl = `https://stayq.space/?ref=${referralCode}`;

    // Get referral records
    const referrals = await this.prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referredUser: {
          select: { id: true, displayName: true, email: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const { balance } = await this.getWalletBalance(userId);

    const totalReferrals = referrals.length;
    const successfulBookings = referrals.filter(
      (r) => r.status === 'FIRST_BOOKING' || r.status === 'REWARDED',
    ).length;
    const totalEarned = referrals.reduce(
      (sum, r) => sum + (r.rewardClaimed ? Number(r.referrerReward) : 0),
      0,
    );

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
        checkoutUsageRule:
          'Max 10% of booking subtotal can be redeemed per checkout.',
      },
    };
  }

  async applyReferralCode(userId: string, code: string) {
    const clean = text(code, 'Referral code', 64).toUpperCase();
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id=${userId} FOR UPDATE`;
      const referrer = await tx.user.findUnique({
        where: { referralCode: clean },
      });
      if (!referrer || referrer.deletedAt)
        throw new NotFoundException('Invalid referral code');
      if (referrer.id === userId)
        throw new BadRequestException('Self-referral is not allowed');
      const existing = await tx.referral.findUnique({
        where: { referredUserId: userId },
      });
      if (existing) {
        if (existing.referrerId !== referrer.id)
          throw new ConflictException('Referral was already applied');
        return { success: true, message: 'Referral is already registered' };
      }
      if (
        await tx.booking.count({
          where: { guestId: userId, status: 'COMPLETED' },
        })
      )
        throw new ConflictException(
          'Referrals must be registered before the first completed stay',
        );
      await tx.referral.create({
        data: {
          referrerId: referrer.id,
          referredUserId: userId,
          referralCode: clean,
          status: 'SIGNED_UP',
          referrerReward: 100,
          referredReward: 100,
        },
      });
      return {
        success: true,
        message:
          'Referral registered; rewards are earned after a completed paid stay',
      };
    });
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
    const maxAllowedDiscount = Math.floor(subtotal * 0.1);
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

  async redeemReferralDiscount(
    userId: string,
    bookingId: string,
    subtotal: number,
    amount: number,
  ) {
    throw new BadRequestException(
      'Apply wallet credit when creating the booking so price and debit are committed together',
    );
  }

  /**
   * BL-042: Reverse wallet discount on booking cancellation
   */
  async reverseWalletDiscount(bookingId: string) {
    return this.prisma.$transaction(async (tx) => {
      const debit = await tx.walletEntry.findFirst({
        where: { referenceId: bookingId, type: 'DEBIT' },
      });
      if (!debit) return { reversed: false };
      await tx.$queryRaw`SELECT id FROM "User" WHERE id=${debit.userId} FOR UPDATE`;
      const referenceId = 'REFUND_' + bookingId;
      const existing = await tx.walletEntry.findFirst({
        where: { userId: debit.userId, referenceId, type: 'CREDIT' },
      });
      if (existing)
        return {
          reversed: true,
          alreadyReversed: true,
          amount: Number(existing.amount),
        };
      await tx.walletEntry.create({
        data: {
          userId: debit.userId,
          amount: debit.amount,
          type: 'CREDIT',
          reason: 'Cancelled booking wallet reversal',
          referenceId,
        },
      });
      return { reversed: true, amount: Number(debit.amount) };
    });
  }

  async withdraw(userId: string, amount: number, bankDetails?: any) {
    throw new BadRequestException(
      'Wallet credits are for booking discounts; cash withdrawal is not enabled',
    );
  }

  async topUp(
    userId: string,
    amount: number,
    paymentId?: string,
    orderId?: string,
  ) {
    throw new BadRequestException(
      'Wallet top-up is unavailable until dedicated wallet payment orders are implemented',
    );
  }
}
