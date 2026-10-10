import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../../payments/payments.service';

export const BOOST_TIERS = [
  {
    id: 'BOOST_BASIC',
    name: '⚡ Boost Basic',
    badgeText: '⚡ FEATURED',
    price: 299,
    durationDays: 7,
    rankBoost: 25,
    tagline: 'Increased Search Visibility + Featured Stay Badge',
    badgeGradient: ['#F59E0B', '#D97706'],
    badgeIcon: 'bolt',
    popular: false,
    features: [
      'Increased Higher Search Ranking in City Feeds',
      'Glowing ⚡ Featured Stay Badge on Explore & Map',
      'Paid ranking weight during the promotion period',
      'Active for 7 full days',
    ],
  },
  {
    id: 'SUPER_BOOST',
    name: '🌟 Super Boost',
    badgeText: '🌟 TRENDING',
    price: 499,
    durationDays: 15,
    rankBoost: 60,
    tagline: 'Increased Search Visibility + Top of Category',
    badgeGradient: ['#5A31F4', '#9333EA'],
    badgeIcon: 'auto_awesome',
    popular: true,
    features: [
      'Increased Higher Search Ranking in Category & City',
      'Glowing 🌟 Trending Stay Badge on Explore & Map',
      'Featured placement at top of Explore categories',
      'Paid category ranking weight during the promotion period',
      'Active for 15 full days',
    ],
  },
  {
    id: 'ULTRA_SPOTLIGHT',
    name: '👑 Ultra Spotlight',
    badgeText: '👑 SPOTLIGHT',
    price: 999,
    durationDays: 30,
    rankBoost: 120,
    tagline: 'Highest available paid search weight',
    badgeGradient: ['#FFB800', '#5A31F4'],
    badgeIcon: 'workspace_premium',
    popular: false,
    features: [
      'Paid ranking weight while the boost is active',
      'Luxury Glowing 👑 StayQ Spotlight Badge',
      'Highest available paid ranking weight',
      '30-day paid promotion period',
      'Active for 30 full days',
    ],
  },
];

@Injectable()
export class PropertiesBoostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Get available boost plans
   */
  getTiers() {
    return {
      success: true,
      tiers: BOOST_TIERS,
    };
  }

  /**
   * Get boost status for a specific property
   */
  async getPropertyBoostStatus(propertyId: string, user: any) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        hostId: true,
        title: true,
        isSponsored: true,
        sponsoredTier: true,
        sponsoredUntil: true,
        searchRankBoost: true,
      },
    });

    if (!property) throw new NotFoundException('Property not found');
    if (property.hostId !== user?.id)
      throw new ForbiddenException('Only the owner can view boost history');

    const isCurrentlyActive =
      property.isSponsored &&
      property.sponsoredUntil &&
      new Date(property.sponsoredUntil) > new Date();

    const activeTier = BOOST_TIERS.find((t) => t.id === property.sponsoredTier);

    const history = await this.prisma.propertyBoost.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      success: true,
      propertyId,
      isActive: Boolean(isCurrentlyActive),
      tier: activeTier || null,
      sponsoredUntil: property.sponsoredUntil,
      searchRankBoost: isCurrentlyActive ? property.searchRankBoost : 0,
      daysRemaining:
        isCurrentlyActive && property.sponsoredUntil
          ? Math.max(
              0,
              Math.ceil(
                (new Date(property.sponsoredUntil).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24),
              ),
            )
          : 0,
      history,
    };
  }

  /**
   * Create Cashfree PG checkout order for Property Boost
   */
  async createBoostCheckout(
    propertyId: string,
    tierId: string,
    user: any,
    key?: string,
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) throw new NotFoundException('Property not found');
    if (property.hostId !== user?.id)
      throw new ForbiddenException('Only the owner can purchase a boost');
    if (property.status !== 'ACTIVE')
      throw new BadRequestException('Boosts require a published listing');
    const tier = BOOST_TIERS.find((t) => t.id === tierId);
    if (!tier) throw new BadRequestException('Invalid boost tier');
    const order = await this.paymentsService.createCashfreeOrder({
      authenticatedUser: user,
      purpose: 'BOOST',
      referenceId: propertyId,
      sku: tier.id,
      amount: tier.price,
      idempotencyKey: key,
    });
    return {
      ...order,
      tier,
      property: { id: property.id, title: property.title, city: property.city },
    };
  }

  /**
   * Activate Boost on successful payment
   */
  async activateBoost(
    propertyId: string,
    tierId: string,
    user: any,
    paymentDetails?: { orderId?: string; paymentId?: string },
  ) {
    const tier = BOOST_TIERS.find((t) => t.id === tierId);
    if (!tier || !paymentDetails?.orderId)
      throw new BadRequestException(
        'Valid boost tier and paid order are required',
      );
    return this.paymentsService.consumePaidOrder(
      paymentDetails.orderId,
      user,
      'BOOST',
      propertyId,
      tier.id,
      async (tx, order) => {
        await tx.$queryRaw`SELECT id FROM "Property" WHERE id=${propertyId} FOR UPDATE`;
        const p = await tx.property.findUniqueOrThrow({
          where: { id: propertyId },
        });
        if (p.hostId !== user.id)
          throw new ForbiddenException('Only the owner can activate boost');
        const now = new Date();
        const active = await tx.propertyBoost.findMany({
          where: { propertyId, status: 'ACTIVE', endDate: { gt: now } },
        });
        // Same-tier purchases extend that tier; a lower-tier purchase cannot extend
        // a previously purchased higher rank beyond its own paid expiry.
        const same = active
          .filter((b) => b.tier === tier.id)
          .reduce((date, b) => (b.endDate > date ? b.endDate : date), now);
        const endDate = new Date(same.getTime() + tier.durationDays * 86400000);
        const boost = await tx.propertyBoost.create({
          data: {
            propertyId,
            hostId: user.id,
            tier: tier.id,
            tierName: tier.name,
            amount: order.amount,
            durationDays: tier.durationDays,
            startDate: now,
            endDate,
            status: 'ACTIVE',
            orderId: order.orderId,
            paymentId: order.paymentReference,
          },
        });
        const highest = [...active, boost].sort(
          (a, b) =>
            (BOOST_TIERS.find((t) => t.id === b.tier)?.rankBoost || 0) -
              (BOOST_TIERS.find((t) => t.id === a.tier)?.rankBoost || 0) ||
            b.endDate.getTime() - a.endDate.getTime(),
        )[0];
        const property = await tx.property.update({
          where: { id: propertyId },
          data: {
            isSponsored: true,
            sponsoredTier: highest.tier,
            sponsoredUntil: highest.endDate,
            searchRankBoost:
              BOOST_TIERS.find((t) => t.id === highest.tier)?.rankBoost || 0,
          },
        });
        return {
          success: true,
          orderId: order.orderId,
          isPaid: true,
          isActive: true,
          boost: { ...boost, isActive: true },
          property: {
            id: property.id,
            title: property.title,
            isSponsored: true,
            sponsoredUntil: property.sponsoredUntil,
            searchRankBoost: property.searchRankBoost,
          },
        };
      },
    );
  }
}
