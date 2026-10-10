import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { text, integer, money } from '../common/utils/input.util';
import { PropertyType } from '@prisma/client';
@Injectable()
export class PricingService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}
  async getMarketIntelligence(params: any) {
    const city = text(params.city, 'City', 100),
      type = (params.propertyType || 'VILLA').toUpperCase();
    if (!Object.values(PropertyType).includes(type))
      throw new BadRequestException('Invalid property type');
    const bedrooms = integer(params.bedrooms ?? 2, 'Bedrooms', 0, 100),
      current =
        params.currentPrice === undefined
          ? null
          : money(params.currentPrice, 'Current price');
    const user = params.userId
      ? await this.prisma.user.findUnique({ where: { id: params.userId } })
      : null;
    const pro = !!(
      user?.isHostPro &&
      user.hostProExpiresAt &&
      user.hostProExpiresAt > new Date()
    );
    const rows = await this.prisma.property.findMany({
      where: {
        city: { equals: city, mode: 'insensitive' },
        type,
        bedrooms,
        status: 'ACTIVE',
        host: { deletedAt: null, hostStatus: { not: 'SUSPENDED' } },
      },
      select: {
        id: true,
        title: true,
        city: true,
        type: true,
        pricePerNight: true,
        amenities: true,
        images: { select: { url: true }, orderBy: { order: 'asc' }, take: 1 },
        reviews: {
          where: { moderationStatus: 'APPROVED' },
          select: { rating: true },
        },
      },
      take: 200,
    });
    const prices = rows
      .map((p) => Number(p.pricePerNight))
      .filter((p) => p > 0 && Number.isFinite(p))
      .sort((a, b) => a - b);
    const round = (x: number) => Math.round(x * 100) / 100;
    const mean = prices.length
      ? round(prices.reduce((a, b) => a + b, 0) / prices.length)
      : null;
    const n = prices.length,
      median = n
        ? round(
            n % 2
              ? prices[Math.floor(n / 2)]
              : (prices[n / 2 - 1] + prices[n / 2]) / 2,
          )
        : null;
    const diff =
      current !== null && mean
        ? Math.round(((current - mean) / mean) * 100)
        : null;
    return {
      city,
      locality: city,
      propertyType: type,
      bedrooms,
      currentHostPrice: current,
      marketAveragePrice: mean,
      priceRange: {
        minPrice: prices[0] ?? null,
        maxPrice: prices[n - 1] ?? null,
        medianPrice: median,
      },
      competitorCount: n,
      recommendedPrice: median,
      priceDiffPercentage: diff,
      pricePosition:
        diff === null
          ? null
          : diff < -15
            ? 'BELOW_AVERAGE'
            : diff > 25
              ? 'PREMIUM'
              : diff > 8
                ? 'ABOVE_AVERAGE'
                : 'COMPETITIVE',
      aiRationale: n
        ? 'Reference price is the median listed rate of comparable active StayQ properties. Listed prices do not establish demand or expected earnings.'
        : 'No comparable active listings are available.',
      projectedOccupancyRate: null,
      estimatedMonthlyEarnings: null,
      demandLevel: null,
      seasonalityFactor: null,
      isProSubscriber: pro,
      isFoundingHostUnlocked: false,
      foundingHostSlotsLeft: null,
      dataConfidence: n >= 3 ? 'OBSERVED_LISTED_PRICES' : 'LIMITED_DATA',
      dataUnavailable: n === 0,
      isSyntheticBenchmark: false,
      competitors: rows.slice(0, 4).map((p, i) => ({
        id: pro ? p.id : 'masked_' + i,
        title: pro ? p.title : 'Comparable ' + p.type,
        locality: p.city,
        city: p.city,
        propertyType: p.type,
        pricePerNight: Number(p.pricePerNight),
        rating: p.reviews.length
          ? round(
              p.reviews.reduce((a, b) => a + b.rating, 0) / p.reviews.length,
            )
          : null,
        reviewCount: p.reviews.length,
        heroImage: p.images[0]?.url || null,
        keyAmenities: p.amenities.slice(0, 4),
        isMasked: !pro,
        isBenchmarkEstimate: false,
        source: 'LIVE_STAYQ',
      })),
    };
  }
}
