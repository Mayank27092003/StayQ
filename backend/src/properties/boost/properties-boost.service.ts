import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
    tagline: '2x Search Visibility + Featured Stay Badge',
    badgeGradient: ['#F59E0B', '#D97706'],
    badgeIcon: 'bolt',
    popular: false,
    features: [
      '2x Higher Search Ranking in City Feeds',
      'Glowing ⚡ Featured Stay Badge on Explore & Map',
      'Targeted recommendations to nearby travelers',
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
    tagline: '5x Search Visibility + Top of Category',
    badgeGradient: ['#5A31F4', '#9333EA'],
    badgeIcon: 'auto_awesome',
    popular: true,
    features: [
      '5x Higher Search Ranking in Category & City',
      'Glowing 🌟 Trending Stay Badge on Explore & Map',
      'Featured placement at top of Explore categories',
      'Priority inclusion in weekly traveler digests',
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
    tagline: '#1 Search Placement + Explore Hero Carousel',
    badgeGradient: ['#FFB800', '#5A31F4'],
    badgeIcon: 'workspace_premium',
    popular: false,
    features: [
      '#1 Guaranteed Top Rank in Search & City Feeds',
      'Luxury Glowing 👑 Stay Q Spotlight Badge',
      'Featured in Top Homepage Explorer Carousel',
      'Dedicated Push Notification Promo to 10,000+ Guests',
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
  async getPropertyBoostStatus(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        title: true,
        isSponsored: true,
        sponsoredTier: true,
        sponsoredUntil: true,
        searchRankBoost: true,
      },
    });

    if (!property) throw new NotFoundException('Property not found');

    const isCurrentlyActive = property.isSponsored && property.sponsoredUntil && new Date(property.sponsoredUntil) > new Date();

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
      daysRemaining: isCurrentlyActive && property.sponsoredUntil
        ? Math.max(0, Math.ceil((new Date(property.sponsoredUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0,
      history,
    };
  }

  /**
   * Create Cashfree PG checkout order for Property Boost
   */
  async createBoostCheckout(propertyId: string, tierId: string, user: any) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { host: true },
    });

    if (!property) throw new NotFoundException('Property not found');
    if (property.hostId !== user.id && !user.isAdmin) {
      throw new ForbiddenException('Only the property owner can create a boost checkout');
    }

    const tier = BOOST_TIERS.find((t) => t.id === tierId);
    if (!tier) throw new BadRequestException(`Invalid boost tier: ${tierId}`);

    const orderId = `BOOST_${property.id.slice(0, 8)}_${Date.now()}`;
    const amount = tier.price;

    const order = await this.paymentsService.createCashfreeOrder({
      bookingId: orderId,
      amount,
      customerId: user.id || property.hostId,
      customerEmail: property.host?.email || user.email || 'host@stayq.space',
      customerPhone: property.host?.phone || user.phone || '9999999999',
      customerName: property.host?.displayName || user.displayName || 'Stay Q Host',
      returnUrl: `https://stayq.space/host/boost/callback?order_id={order_id}&property_id=${propertyId}&tier=${tierId}`,
    });
    const paymentSessionId = (order as any).paymentSessionId || (order as any).payment_session_id || '';
    const cfOrderId = (order as any).orderId || (order as any).order_id || orderId;

    return {
      success: true,
      orderId: cfOrderId,
      amount,
      currency: 'INR',
      tier,
      property: {
        id: property.id,
        title: property.title,
        city: property.city,
      },
      paymentSessionId,
    };
  }

  /**
   * Activate Boost on successful payment
   */
  async activateBoost(propertyId: string, tierId: string, user: any, paymentDetails?: { orderId?: string; paymentId?: string }) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');

    if (property.hostId !== user.id && !user.isAdmin) {
      throw new ForbiddenException('Only the property owner can activate boost');
    }

    if (!paymentDetails?.orderId) {
      throw new BadRequestException('Payment orderId is required to activate boost');
    }

    const tier = BOOST_TIERS.find((t) => t.id === tierId);
    if (!tier) throw new BadRequestException(`Invalid boost tier: ${tierId}`);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + tier.durationDays);

    // Create PropertyBoost record in database
    const boostRecord = await this.prisma.propertyBoost.create({
      data: {
        propertyId,
        hostId: user.id || property.hostId,
        tier: tier.id,
        tierName: tier.name,
        amount: tier.price,
        durationDays: tier.durationDays,
        startDate,
        endDate,
        status: 'ACTIVE',
        orderId: paymentDetails.orderId,
        paymentId: paymentDetails.paymentId || null,
      },
    });

    // Update Property with live sponsored ranking boost
    const updatedProperty = await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        isSponsored: true,
        sponsoredTier: tier.id,
        sponsoredUntil: endDate,
        searchRankBoost: tier.rankBoost,
      },
    });

    return {
      success: true,
      message: `Property "${property.title}" is now boosted with ${tier.name}!`,
      boost: boostRecord,
      property: {
        id: updatedProperty.id,
        title: updatedProperty.title,
        isSponsored: updatedProperty.isSponsored,
        sponsoredTier: updatedProperty.sponsoredTier,
        sponsoredUntil: updatedProperty.sponsoredUntil,
        searchRankBoost: updatedProperty.searchRankBoost,
      },
    };
  }
}
