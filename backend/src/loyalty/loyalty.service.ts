import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoyaltyTier, PointsTransactionType } from '@prisma/client';

export interface TierBenefit {
  tier: LoyaltyTier;
  title: string;
  price: number; // in INR per year (0 for Starter)
  multiplier: number;
  badge: string;
  perks: string[];
}

export const TIER_CONFIGS: Record<LoyaltyTier, TierBenefit> = {
  Q_STARTER: {
    tier: LoyaltyTier.Q_STARTER,
    title: 'Q Starter',
    price: 0,
    multiplier: 1.0,
    badge: 'Starter',
    perks: [
      'Earn 1 pt per ₹100 spent',
      'Redeem 500 pts for ₹250 Stay Q Credit',
      'Exclusive member-only discounts',
      'Standard guest support',
    ],
  },
  Q_PLUS: {
    tier: LoyaltyTier.Q_PLUS,
    title: 'Q Plus',
    price: 499,
    multiplier: 1.5,
    badge: 'Plus Member',
    perks: [
      '1.5x Points multiplier on all bookings',
      'Early check-in & late checkout (subject to availability)',
      'Priority 24/7 VIP guest concierge',
      '5% extra discount on select luxury villas & RVs',
      'Free welcome drink / hamper at participating stays',
    ],
  },
  Q_PREMIUM: {
    tier: LoyaltyTier.Q_PREMIUM,
    title: 'Q Premium',
    price: 999,
    multiplier: 2.0,
    badge: 'Elite VIP',
    perks: [
      '2.0x Double points multiplier on all bookings',
      'Complimentary room/stay upgrades when available',
      'Zero cancellation penalty on flexible tier properties',
      'Dedicated personal trip designer & concierge',
      'VIP airport / city transfer coordination discounts',
      'Priority invitation to curated Stay Q experiences',
    ],
  },
};

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or automatically initialize a user's LoyaltyProfile.
   */
  async getOrCreateProfile(userId: string) {
    let profile = await this.prisma.loyaltyProfile.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!profile) {
      profile = await this.prisma.loyaltyProfile.create({
        data: {
          userId,
          tier: LoyaltyTier.Q_STARTER,
          pointsMultiplier: 1.0,
        },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });
    }

    // Check if paid tier expired
    if (profile.tierExpiresAt && profile.tierExpiresAt < new Date() && profile.tier !== LoyaltyTier.Q_STARTER) {
      profile = await this.prisma.loyaltyProfile.update({
        where: { id: profile.id },
        data: {
          tier: LoyaltyTier.Q_STARTER,
          pointsMultiplier: 1.0,
          tierExpiresAt: null,
        },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });
    }

    const currentConfig = TIER_CONFIGS[profile.tier];

    return {
      ...profile,
      tierDetails: currentConfig,
      creditEquivalent: profile.availablePoints * 0.5, // 500 pts = ₹250 credit (0.5 ratio)
      allTiers: Object.values(TIER_CONFIGS),
    };
  }

  /**
   * Award points when a guest completes a booking.
   * ₹100 spent = 1 point * multiplier.
   */
  async awardBookingPoints(userId: string, bookingId: string, totalAmount: number) {
    if (totalAmount <= 0) return null;

    const profile = await this.prisma.loyaltyProfile.upsert({
      where: { userId },
      create: { userId, tier: LoyaltyTier.Q_STARTER, pointsMultiplier: 1.0 },
      update: {},
    });

    const basePoints = Math.floor(totalAmount / 100);
    const earnedPoints = Math.max(1, Math.floor(basePoints * profile.pointsMultiplier));

    if (earnedPoints <= 0) return null;

    return this.prisma.$transaction(async (tx) => {
      const updatedProfile = await tx.loyaltyProfile.update({
        where: { id: profile.id },
        data: {
          totalPoints: { increment: earnedPoints },
          availablePoints: { increment: earnedPoints },
        },
      });

      await tx.pointsTransaction.create({
        data: {
          loyaltyId: profile.id,
          points: earnedPoints,
          type: PointsTransactionType.BOOKING_EARN,
          reason: `Earned for booking #${bookingId.substring(0, 8).toUpperCase()} (₹${Math.round(totalAmount).toLocaleString()})`,
          referenceId: bookingId,
        },
      });

      return updatedProfile;
    });
  }

  /**
   * Award 10 points when a guest writes a verified review.
   */
  async awardReviewPoints(userId: string, reviewId: string, propertyTitle?: string) {
    const profile = await this.prisma.loyaltyProfile.upsert({
      where: { userId },
      create: { userId, tier: LoyaltyTier.Q_STARTER, pointsMultiplier: 1.0 },
      update: {},
    });

    const points = 10;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.loyaltyProfile.update({
        where: { id: profile.id },
        data: {
          totalPoints: { increment: points },
          availablePoints: { increment: points },
        },
      });

      await tx.pointsTransaction.create({
        data: {
          loyaltyId: profile.id,
          points,
          type: PointsTransactionType.REVIEW_EARN,
          reason: propertyTitle ? `Review bonus for ${propertyTitle}` : `Review bonus for stay review`,
          referenceId: reviewId,
        },
      });

      return updated;
    });
  }

  /**
   * Award 25 points when a friend referred by user completes their first stay.
   */
  async awardReferralPoints(userId: string, referralId: string, friendName?: string) {
    const profile = await this.prisma.loyaltyProfile.upsert({
      where: { userId },
      create: { userId, tier: LoyaltyTier.Q_STARTER, pointsMultiplier: 1.0 },
      update: {},
    });

    const points = 25;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.loyaltyProfile.update({
        where: { id: profile.id },
        data: {
          totalPoints: { increment: points },
          availablePoints: { increment: points },
        },
      });

      await tx.pointsTransaction.create({
        data: {
          loyaltyId: profile.id,
          points,
          type: PointsTransactionType.REFERRAL_EARN,
          reason: friendName ? `Referral reward for inviting ${friendName}` : `Referral reward for successful invite`,
          referenceId: referralId,
        },
      });

      return updated;
    });
  }

  /**
   * Award 15 points one-time for completing profile & verification.
   */
  async awardProfileCompletionPoints(userId: string) {
    const profile = await this.prisma.loyaltyProfile.upsert({
      where: { userId },
      create: { userId, tier: LoyaltyTier.Q_STARTER, pointsMultiplier: 1.0 },
      update: {},
    });

    if (profile.profileCompletionRewarded) {
      return profile;
    }

    const points = 15;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.loyaltyProfile.update({
        where: { id: profile.id },
        data: {
          totalPoints: { increment: points },
          availablePoints: { increment: points },
          profileCompletionRewarded: true,
        },
      });

      await tx.pointsTransaction.create({
        data: {
          loyaltyId: profile.id,
          points,
          type: PointsTransactionType.PROFILE_EARN,
          reason: 'Profile & KYC Completion Bonus',
          referenceId: userId,
        },
      });

      return updated;
    });
  }

  /**
   * Award 20 bonus points for repeat stay at the same property.
   */
  async awardRepeatStayPoints(userId: string, bookingId: string, propertyTitle: string) {
    const profile = await this.prisma.loyaltyProfile.upsert({
      where: { userId },
      create: { userId, tier: LoyaltyTier.Q_STARTER, pointsMultiplier: 1.0 },
      update: {},
    });

    const points = 20;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.loyaltyProfile.update({
        where: { id: profile.id },
        data: {
          totalPoints: { increment: points },
          availablePoints: { increment: points },
        },
      });

      await tx.pointsTransaction.create({
        data: {
          loyaltyId: profile.id,
          points,
          type: PointsTransactionType.REPEAT_STAY_EARN,
          reason: `Repeat loyalty bonus at ${propertyTitle}`,
          referenceId: bookingId,
        },
      });

      return updated;
    });
  }

  /**
   * Redeem points for Stay Q Wallet Credit.
   * 500 points = ₹250 credit.
   */
  async redeemPoints(userId: string, pointsToRedeem: number) {
    if (!pointsToRedeem || pointsToRedeem < 100) {
      throw new BadRequestException('Minimum 100 points required for redemption');
    }

    const profile = await this.prisma.loyaltyProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Loyalty profile not found');
    }

    if (profile.availablePoints < pointsToRedeem) {
      throw new BadRequestException(`Insufficient points balance. You have ${profile.availablePoints} points.`);
    }

    // 500 pts = ₹250 (1 pt = ₹0.50 credit)
    const creditAmount = pointsToRedeem * 0.5;

    return this.prisma.$transaction(async (tx) => {
      // 1. Deduct points
      const updatedProfile = await tx.loyaltyProfile.update({
        where: { id: profile.id },
        data: {
          availablePoints: { decrement: pointsToRedeem },
          redeemedPoints: { increment: pointsToRedeem },
        },
      });

      // 2. Add points transaction
      await tx.pointsTransaction.create({
        data: {
          loyaltyId: profile.id,
          points: -pointsToRedeem,
          type: PointsTransactionType.REDEEM,
          reason: `Redeemed ${pointsToRedeem} points for ₹${creditAmount} Stay Q Credit`,
        },
      });

      // 3. Credit user's wallet
      await tx.walletEntry.create({
        data: {
          userId,
          amount: creditAmount,
          type: 'CREDIT',
          reason: `Stay Q Rewards Points Redemption (${pointsToRedeem} pts)`,
        },
      });

      return {
        success: true,
        redeemedPoints: pointsToRedeem,
        creditEarned: creditAmount,
        remainingPoints: updatedProfile.availablePoints,
      };
    });
  }

  /**
   * Upgrade user membership tier (Q_PLUS or Q_PREMIUM).
   */
  async upgradeTier(userId: string, targetTier: LoyaltyTier) {
    const config = TIER_CONFIGS[targetTier];
    if (!config || targetTier === LoyaltyTier.Q_STARTER) {
      throw new BadRequestException('Invalid upgrade tier selected');
    }

    const profile = await this.prisma.loyaltyProfile.upsert({
      where: { userId },
      create: { userId, tier: LoyaltyTier.Q_STARTER, pointsMultiplier: 1.0 },
      update: {},
    });

    const now = new Date();
    const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const welcomeBonusPoints = targetTier === LoyaltyTier.Q_PREMIUM ? 100 : 50;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.loyaltyProfile.update({
        where: { id: profile.id },
        data: {
          tier: targetTier,
          pointsMultiplier: config.multiplier,
          tierPurchasedAt: now,
          tierExpiresAt: oneYearLater,
          totalPoints: { increment: welcomeBonusPoints },
          availablePoints: { increment: welcomeBonusPoints },
        },
      });

      await tx.pointsTransaction.create({
        data: {
          loyaltyId: profile.id,
          points: welcomeBonusPoints,
          type: PointsTransactionType.TIER_PURCHASE_EARN,
          reason: `Welcome bonus for joining ${config.title}`,
        },
      });

      return {
        success: true,
        tier: updated.tier,
        tierTitle: config.title,
        multiplier: updated.pointsMultiplier,
        expiresAt: updated.tierExpiresAt,
        welcomeBonus: welcomeBonusPoints,
        availablePoints: updated.availablePoints,
      };
    });
  }

  /**
   * Get paginated points history for user.
   */
  async getPointsHistory(userId: string, page: number = 1, limit: number = 20) {
    const profile = await this.prisma.loyaltyProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return { transactions: [], total: 0, page, totalPages: 0 };
    }

    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      this.prisma.pointsTransaction.findMany({
        where: { loyaltyId: profile.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.pointsTransaction.count({
        where: { loyaltyId: profile.id },
      }),
    ]);

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get all tiers metadata.
   */
  getAllTiers() {
    return Object.values(TIER_CONFIGS);
  }
}
