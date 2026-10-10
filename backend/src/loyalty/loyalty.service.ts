import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoyaltyTier, PointsTransactionType } from '@prisma/client';
import { PaymentsService } from '../payments/payments.service';
import { integer, idempotencyKey } from '../common/utils/input.util';
export interface TierBenefit {
  tier: LoyaltyTier;
  title: string;
  price: number;
  multiplier: number;
  badge: string;
  perks: string[];
}
export const TIER_CONFIGS: Record<LoyaltyTier, TierBenefit> = {
  Q_STARTER: {
    tier: LoyaltyTier.Q_STARTER,
    title: 'Q Starter',
    price: 0,
    multiplier: 1,
    badge: 'Starter',
    perks: ['1 point per INR 100 spent', 'Redeem points for wallet credit'],
  },
  Q_PLUS: {
    tier: LoyaltyTier.Q_PLUS,
    title: 'Q Plus',
    price: 499,
    multiplier: 1.5,
    badge: 'Plus Member',
    perks: ['1.5x booking points for one year'],
  },
  Q_PREMIUM: {
    tier: LoyaltyTier.Q_PREMIUM,
    title: 'Q Premium',
    price: 999,
    multiplier: 2,
    badge: 'Elite VIP',
    perks: ['2x booking points for one year'],
  },
};
@Injectable()
export class LoyaltyService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly payments: PaymentsService,
  ) {}
  async getOrCreateProfile(userId: string) {
    const p = await this.prisma.loyaltyProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    const expired = p.tierExpiresAt && p.tierExpiresAt <= new Date();
    const tier = expired ? LoyaltyTier.Q_STARTER : p.tier;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });
    const entries = await this.prisma.walletEntry.findMany({
      where: { userId },
    });
    const referralBalance =
      entries.reduce(
        (sum, e) =>
          sum +
          Math.round(Number(e.amount) * 100) * (e.type === 'CREDIT' ? 1 : -1),
        0,
      ) / 100;
    return {
      ...p,
      tier,
      pointsMultiplier: TIER_CONFIGS[tier].multiplier,
      tierDetails: TIER_CONFIGS[tier],
      creditEquivalent: p.availablePoints * 0.5,
      allTiers: Object.values(TIER_CONFIGS),
      referralCode: user?.referralCode || null,
      referralBalance,
    };
  }
  private async award(
    userId: string,
    type: PointsTransactionType,
    referenceId: string,
    points: number,
    reason: string,
  ) {
    integer(points, 'Points', 0, 100000000);
    if (!points) return null;
    return this.prisma.$transaction(async (tx) => {
      const p = await tx.loyaltyProfile.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });
      await tx.$queryRaw`SELECT id FROM "LoyaltyProfile" WHERE id=${p.id} FOR UPDATE`;
      const existing = await tx.pointsTransaction.findFirst({
        where: { loyaltyId: p.id, type, referenceId },
      });
      if (existing)
        return tx.loyaltyProfile.findUnique({ where: { id: p.id } });
      await tx.pointsTransaction.create({
        data: { loyaltyId: p.id, type, referenceId, points, reason },
      });
      return tx.loyaltyProfile.update({
        where: { id: p.id },
        data: {
          availablePoints: { increment: points },
          totalPoints: { increment: points },
          ...(type === 'PROFILE_EARN'
            ? { profileCompletionRewarded: true }
            : {}),
        },
      });
    });
  }
  async awardBookingPoints(
    userId: string,
    bookingId: string,
    totalAmount: number,
  ) {
    const b = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });
    if (
      !b ||
      b.guestId !== userId ||
      b.status !== 'COMPLETED' ||
      !['CAPTURED', 'RELEASED'].includes(b.payment?.status || '')
    )
      throw new ConflictException(
        'Only completed paid stays earn booking points',
      );
    const p = await this.getOrCreateProfile(userId);
    const points = Math.floor(
      (Number(b.totalAmount) / 100) * p.pointsMultiplier,
    );
    return this.award(
      userId,
      PointsTransactionType.BOOKING_EARN,
      bookingId,
      points,
      'Completed stay reward',
    );
  }
  private async reverse(
    userId: string,
    referenceId: string,
    type: PointsTransactionType,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const p = await tx.loyaltyProfile.findUnique({ where: { userId } });
      if (!p) return null;
      await tx.$queryRaw`SELECT id FROM "LoyaltyProfile" WHERE id=${p.id} FOR UPDATE`;
      const earn = await tx.pointsTransaction.findFirst({
        where: { loyaltyId: p.id, type, referenceId },
      });
      if (!earn) return p;
      const ref = `reversal:${type}:${referenceId}`;
      if (
        await tx.pointsTransaction.findFirst({
          where: { loyaltyId: p.id, referenceId: ref },
        })
      )
        return p;
      const fresh = await tx.loyaltyProfile.findUniqueOrThrow({
        where: { id: p.id },
      });
      // Keep debt if already redeemed; cancellation cannot preserve unearned wallet value.
      await tx.pointsTransaction.create({
        data: {
          loyaltyId: p.id,
          type: 'ADMIN_ADJUST',
          referenceId: ref,
          points: -earn.points,
          reason: 'Reward reversal',
        },
      });
      return tx.loyaltyProfile.update({
        where: { id: p.id },
        data: {
          totalPoints: { decrement: earn.points },
          availablePoints: { decrement: earn.points },
        },
      });
    });
  }
  reverseBookingPoints(userId: string, id: string) {
    return this.reverse(userId, id, PointsTransactionType.BOOKING_EARN);
  }
  private async reconcileReviewPoints(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Review" WHERE id=${id} FOR UPDATE`;
      const r = await tx.review.findUnique({ where: { id } });
      if (!r || r.guestId !== userId) return null;
      const p = await tx.loyaltyProfile.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });
      await tx.$queryRaw`SELECT id FROM "LoyaltyProfile" WHERE id=${p.id} FOR UPDATE`;
      const entries = await tx.pointsTransaction.findMany({
        where: {
          loyaltyId: p.id,
          OR: [
            { referenceId: id },
            { referenceId: `reversal:REVIEW_EARN:${id}` },
          ],
        },
      });
      const delta =
        (r.moderationStatus === 'APPROVED' ? 10 : 0) -
        entries.reduce((n, e) => n + e.points, 0);
      if (!delta) return p;
      await tx.pointsTransaction.create({
        data: {
          loyaltyId: p.id,
          type: delta > 0 ? 'REVIEW_EARN' : 'ADMIN_ADJUST',
          referenceId: id,
          points: delta,
          reason: 'Reconciled review moderation reward',
        },
      });
      return tx.loyaltyProfile.update({
        where: { id: p.id },
        data: {
          availablePoints: { increment: delta },
          totalPoints: { increment: delta },
        },
      });
    });
  }
  reverseReviewPoints(userId: string, id: string) {
    return this.reconcileReviewPoints(userId, id);
  }
  awardReviewPoints(userId: string, id: string, title?: string) {
    return this.reconcileReviewPoints(userId, id);
  }

  awardReferralPoints(userId: string, id: string, name?: string) {
    return this.award(
      userId,
      PointsTransactionType.REFERRAL_EARN,
      id,
      25,
      'Completed referral reward',
    );
  }
  async awardProfileCompletionPoints(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const id = await this.prisma.verificationChallenge.findFirst({
      where: {
        userId,
        kind: { in: ['AADHAAR', 'PAN'] },
        status: 'VERIFIED',
        expiresAt: { gt: new Date() },
      },
    });
    if (!user?.displayName || !user.emailVerified || !id)
      throw new BadRequestException(
        'Complete the profile, verify email and identity before claiming this bonus',
      );
    return this.award(
      userId,
      PointsTransactionType.PROFILE_EARN,
      userId,
      15,
      'Verified profile reward',
    );
  }
  async awardRepeatStayPoints(userId: string, id: string, title: string) {
    const b = await this.prisma.booking.findUnique({ where: { id } });
    if (!b || b.status !== 'COMPLETED' || b.guestId !== userId)
      throw new ConflictException('Repeat rewards require a completed stay');
    const previous = await this.prisma.booking.count({
      where: {
        guestId: userId,
        propertyId: b.propertyId,
        id: { not: id },
        status: 'COMPLETED',
      },
    });
    return previous
      ? this.award(
          userId,
          PointsTransactionType.REPEAT_STAY_EARN,
          id,
          20,
          'Repeat stay reward',
        )
      : null;
  }
  async redeemPoints(userId: string, points: number, key?: string) {
    integer(points, 'Points', 100, 100000000);
    const clean = idempotencyKey(key);
    if (!clean)
      throw new BadRequestException(
        'Idempotency-Key is required for redemption',
      );
    return this.prisma.$transaction(async (tx) => {
      // Consistent wallet lock precedes the loyalty lock for every redemption.
      await tx.$queryRaw`SELECT id FROM "User" WHERE id=${userId} FOR UPDATE`;
      const p = await tx.loyaltyProfile.findUnique({ where: { userId } });
      if (!p) throw new NotFoundException('Loyalty profile not found');
      await tx.$queryRaw`SELECT id FROM "LoyaltyProfile" WHERE id=${p.id} FOR UPDATE`;
      const ref = `redeem:${userId}:${clean}`;
      const previous = await tx.pointsTransaction.findFirst({
        where: { loyaltyId: p.id, referenceId: ref, type: 'REDEEM' },
      });
      if (previous) {
        if (previous.points !== -points)
          throw new ConflictException(
            'Redemption key has a different points amount',
          );
        return {
          success: true,
          redeemedPoints: points,
          creditEarned: points * 0.5,
          remainingPoints: (
            await tx.loyaltyProfile.findUniqueOrThrow({ where: { id: p.id } })
          ).availablePoints,
        };
      }
      const current = await tx.loyaltyProfile.findUniqueOrThrow({
        where: { id: p.id },
      });
      if (current.availablePoints < points)
        throw new BadRequestException('Insufficient points');
      const updated = await tx.loyaltyProfile.update({
        where: { id: p.id },
        data: {
          availablePoints: { decrement: points },
          redeemedPoints: { increment: points },
        },
      });
      await tx.pointsTransaction.create({
        data: {
          loyaltyId: p.id,
          type: 'REDEEM',
          points: -points,
          referenceId: ref,
          reason: 'Wallet credit redemption',
        },
      });
      await tx.walletEntry.create({
        data: {
          userId,
          type: 'CREDIT',
          amount: points * 0.5,
          referenceId: ref,
          reason: 'Points redemption',
        },
      });
      return {
        success: true,
        redeemedPoints: points,
        creditEarned: points * 0.5,
        remainingPoints: updated.availablePoints,
      };
    });
  }
  async createTierOrder(userId: string, tier: LoyaltyTier, key?: string) {
    const config = TIER_CONFIGS[tier];
    if (!config || tier === 'Q_STARTER')
      throw new BadRequestException('Invalid paid membership tier');
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    return this.payments.createCashfreeOrder({
      authenticatedUser: user,
      purpose: 'LOYALTY',
      referenceId: userId,
      sku: tier,
      amount: config.price,
      idempotencyKey: key,
    });
  }
  async upgradeTier(userId: string, tier: LoyaltyTier, orderId?: string) {
    const config = TIER_CONFIGS[tier];
    if (!config || tier === 'Q_STARTER' || !orderId)
      throw new BadRequestException(
        'Paid order and valid membership tier are required',
      );
    return this.payments.consumePaidOrder(
      orderId,
      { id: userId },
      'LOYALTY',
      userId,
      tier,
      async (tx, order) => {
        const p = await tx.loyaltyProfile.upsert({
          where: { userId },
          create: { userId },
          update: {},
        });
        await tx.$queryRaw`SELECT id FROM "LoyaltyProfile" WHERE id=${p.id} FOR UPDATE`;
        const current = await tx.loyaltyProfile.findUniqueOrThrow({
          where: { id: p.id },
        });
        const now = new Date();
        const base =
          current.tier === tier &&
          current.tierExpiresAt &&
          current.tierExpiresAt > now
            ? current.tierExpiresAt
            : now;
        const expiresAt = new Date(base.getTime() + 365 * 86400000);
        const bonus = tier === 'Q_PREMIUM' ? 100 : 50;
        const updated = await tx.loyaltyProfile.update({
          where: { id: p.id },
          data: {
            tier,
            pointsMultiplier: config.multiplier,
            tierPurchasedAt: now,
            tierExpiresAt: expiresAt,
            totalPoints: { increment: bonus },
            availablePoints: { increment: bonus },
          },
        });
        await tx.pointsTransaction.create({
          data: {
            loyaltyId: p.id,
            type: 'TIER_PURCHASE_EARN',
            points: bonus,
            referenceId: order.orderId,
            reason: 'Paid membership welcome bonus',
          },
        });
        return {
          success: true,
          orderId: order.orderId,
          isPaid: true,
          isActive: true,
          tier,
          expiresAt,
          availablePoints: updated.availablePoints,
          welcomeBonus: bonus,
        };
      },
    );
  }
  async getPointsHistory(userId: string, page = 1, limit = 20) {
    page = integer(page, 'Page', 1, 100000);
    limit = integer(limit, 'Limit', 1, 100);
    const p = await this.prisma.loyaltyProfile.findUnique({
      where: { userId },
    });
    if (!p) return { transactions: [], total: 0, page, totalPages: 0 };
    const [transactions, total] = await Promise.all([
      this.prisma.pointsTransaction.findMany({
        where: { loyaltyId: p.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.pointsTransaction.count({ where: { loyaltyId: p.id } }),
    ]);
    return { transactions, total, page, totalPages: Math.ceil(total / limit) };
  }
  getAllTiers() {
    return Object.values(TIER_CONFIGS);
  }
}
