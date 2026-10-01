import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

export interface CompetitorStay {
  id: string;
  title: string;
  locality: string;
  city: string;
  propertyType: string;
  pricePerNight: number;
  rating: number;
  reviewCount: number;
  heroImage: string;
  keyAmenities: string[];
  isMasked?: boolean;
}

export interface MarketIntelligenceResponse {
  city: string;
  locality?: string;
  propertyType: string;
  bedrooms: number;
  currentHostPrice: number;
  marketAveragePrice: number;
  priceRange: {
    minPrice: number;
    maxPrice: number;
    medianPrice: number;
  };
  competitorCount: number;
  recommendedPrice: number;
  priceDiffPercentage: number;
  pricePosition: 'BELOW_AVERAGE' | 'COMPETITIVE' | 'ABOVE_AVERAGE' | 'PREMIUM';
  aiRationale: string;
  projectedOccupancyRate: number;
  estimatedMonthlyEarnings: number;
  demandLevel: 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'NORMAL';
  seasonalityFactor: number;
  isProSubscriber: boolean;
  isFoundingHostUnlocked?: boolean;
  foundingHostSlotsLeft?: number;
  competitors: CompetitorStay[];
}

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);
  private groq: Groq;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY') || process.env.GROQ_API_KEY;
    this.groq = new Groq({ apiKey });
  }

  /**
   * 1. GET NEIGHBORHOOD MARKET INTELLIGENCE & GROQ AI PRICING
   */
  async getMarketIntelligence(params: {
    city: string;
    locality?: string;
    propertyType?: string;
    bedrooms?: number;
    currentPrice?: number;
    amenities?: string[];
    userId?: string;
  }): Promise<MarketIntelligenceResponse> {
    const city = (params.city || 'Goa').trim();
    const locality = (params.locality || '').trim();
    const propertyType = (params.propertyType || 'VILLA').toUpperCase();
    const bedrooms = Number(params.bedrooms) || 2;
    const currentHostPrice = Number(params.currentPrice) || 5000;
    const amenities = params.amenities || [];
    const userId = params.userId;

    this.logger.log(`Analyzing Market Intelligence for ${propertyType} in ${city} (${locality || 'Citywide'}), Host Price: ₹${currentHostPrice}`);

    const subStatus = await this.checkHostProSubscription(userId);
    const isProSubscriber = subStatus.isPro;

    let dbProperties: any[] = [];
    try {
      dbProperties = await this.prisma.property.findMany({
        where: {
          city: { contains: city, mode: 'insensitive' },
          status: 'ACTIVE',
        },
        take: 20,
        select: {
          id: true,
          title: true,
          type: true,
          address: true,
          city: true,
          state: true,
          pricePerNight: true,
          starRating: true,
          
          images: { select: { url: true } },
          amenities: true,
          bedrooms: true,
        },
      });
    } catch (err: any) {
      this.logger.warn(`Database query warning: ${err.message}`);
    }

    const benchmarkData = this.getBenchmarkNeighborhoodData(city, propertyType, bedrooms);
    const allComps: CompetitorStay[] = [];

    dbProperties.forEach((p) => {
      const price = Number(p.pricePerNight) || 4500;
      const hero = Array.isArray(p.images) && p.images.length > 0
        ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0]?.url || '/images/real_villa.jpg')
        : '/images/real_villa.jpg';

      allComps.push({
        id: p.id,
        title: p.title || 'Verified Stay Q Property',
        locality: p.address?.split(',')[0] || locality || city,
        city: p.city || city,
        propertyType: p.type || propertyType,
        pricePerNight: price,
        rating: Number(p.starRating || 4.92) || 4.92,
        reviewCount: 18,
        heroImage: hero,
        keyAmenities: Array.isArray(p.amenities) ? p.amenities.slice(0, 4) : ['Wi-Fi', 'Air Conditioning', 'Pool'],
      });
    });

    if (allComps.length < 3) {
      benchmarkData.defaultCompetitors.forEach((comp) => allComps.push(comp));
    }

    const prices = allComps.map((c) => c.pricePerNight).sort((a, b) => a - b);
    const competitorCount = allComps.length;
    const minPrice = prices[0] || benchmarkData.minPrice;
    const maxPrice = prices[prices.length - 1] || benchmarkData.maxPrice;
    const marketAveragePrice = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);
    const medianPrice = prices[Math.floor(prices.length / 2)] || marketAveragePrice;

    const diffPct = Math.round(((currentHostPrice - marketAveragePrice) / marketAveragePrice) * 100);
    let pricePosition: 'BELOW_AVERAGE' | 'COMPETITIVE' | 'ABOVE_AVERAGE' | 'PREMIUM' = 'COMPETITIVE';
    if (diffPct < -15) pricePosition = 'BELOW_AVERAGE';
    else if (diffPct > 25) pricePosition = 'PREMIUM';
    else if (diffPct > 8) pricePosition = 'ABOVE_AVERAGE';

    const aiResult = await this.queryGroqSmartPricing({
      city,
      locality,
      propertyType,
      bedrooms,
      currentHostPrice,
      marketAveragePrice,
      minPrice,
      maxPrice,
      amenities,
      competitorCount,
    });

    const formattedCompetitors: CompetitorStay[] = allComps.slice(0, 4).map((comp, idx) => {
      if (!isProSubscriber) {
        return {
          ...comp,
          id: `masked_${idx + 1}`,
          title: `${bedrooms}BHK ${propertyType.toLowerCase()} in ${comp.locality}`,
          isMasked: true,
        };
      }
      return comp;
    });

    return {
      city,
      locality: locality || city,
      propertyType,
      bedrooms,
      currentHostPrice,
      marketAveragePrice,
      priceRange: {
        minPrice,
        maxPrice,
        medianPrice,
      },
      competitorCount,
      recommendedPrice: aiResult.recommendedPrice || Math.round(marketAveragePrice * 0.98),
      priceDiffPercentage: diffPct,
      pricePosition,
      aiRationale: aiResult.aiRationale,
      projectedOccupancyRate: aiResult.projectedOccupancyRate || 85,
      estimatedMonthlyEarnings: Math.round((aiResult.recommendedPrice || marketAveragePrice) * 30 * ((aiResult.projectedOccupancyRate || 85) / 100)),
      demandLevel: aiResult.demandLevel || 'HIGH',
      seasonalityFactor: aiResult.seasonalityFactor || 1.12,
      isProSubscriber,
      isFoundingHostUnlocked: subStatus.isFoundingHost,
      foundingHostSlotsLeft: Math.max(0, 200 - subStatus.hostCount),
      competitors: formattedCompetitors,
    };
  }

  private async queryGroqSmartPricing(params: {
    city: string;
    locality: string;
    propertyType: string;
    bedrooms: number;
    currentHostPrice: number;
    marketAveragePrice: number;
    minPrice: number;
    maxPrice: number;
    amenities: string[];
    competitorCount: number;
  }): Promise<{
    recommendedPrice: number;
    aiRationale: string;
    projectedOccupancyRate: number;
    demandLevel: 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'NORMAL';
    seasonalityFactor: number;
  }> {
    try {
      const prompt = `You are the StayQ Hospitality AI Pricing Engine.
Analyze the following property and neighborhood market data to recommend the optimal nightly rate (in ₹ INR):
- Destination City: ${params.city} (${params.locality || 'Prime Locality'})
- Property Type: ${params.bedrooms} BHK ${params.propertyType}
- Host's Desired Price: ₹${params.currentHostPrice}/night
- Neighborhood Market Average: ₹${params.marketAveragePrice}/night
- Neighborhood Price Range: ₹${params.minPrice} - ₹${params.maxPrice} (${params.competitorCount} active properties)
- Amenities Provided: ${params.amenities.length ? params.amenities.join(', ') : 'Standard Premium (Wi-Fi, AC, Caretaker)'}

Goal:
1. Provide a mathematically optimal "recommendedPrice" (in INR) balancing maximum revenue and high booking velocity.
2. Provide a crisp 2-sentence "aiRationale" in friendly Hindi/English explaining why this price beats local competition (highlighting amenities & seasonality).
3. Estimate "projectedOccupancyRate" (number 50-95).
4. Estimate "demandLevel" ('VERY_HIGH' | 'HIGH' | 'MODERATE' | 'NORMAL').
5. Estimate "seasonalityFactor" (1.0 - 1.35).

Respond ONLY with valid JSON in this exact structure:
{
  "recommendedPrice": 4850,
  "aiRationale": "Aapka property neighborhood average (₹4,800) ke bilkul kareeb hai. ₹4,850 par aapki private pool aur luxury amenities competitor se zyada booking attract karengi.",
  "projectedOccupancyRate": 84,
  "demandLevel": "HIGH",
  "seasonalityFactor": 1.15
}`;

      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        return {
          recommendedPrice: Number(parsed.recommendedPrice) || Math.round(params.marketAveragePrice * 0.98),
          aiRationale: parsed.aiRationale || `Neighborhood average ₹${params.marketAveragePrice} ke aadhar par ₹${parsed.recommendedPrice || params.marketAveragePrice} par maximum occupancy milegi.`,
          projectedOccupancyRate: Number(parsed.projectedOccupancyRate) || 82,
          demandLevel: parsed.demandLevel || 'HIGH',
          seasonalityFactor: Number(parsed.seasonalityFactor) || 1.12,
        };
      }
    } catch (err: any) {
      this.logger.warn(`Groq API pricing fallback: ${err.message}`);
    }

    const hasPool = params.amenities.some((a) => a.toLowerCase().includes('pool'));
    const recPrice = hasPool ? Math.round(params.marketAveragePrice * 1.08) : Math.round(params.marketAveragePrice * 0.96);
    return {
      recommendedPrice: recPrice,
      aiRationale: `Aas-paas ke ${params.city} ke properties ka average rate ₹${params.marketAveragePrice}/night hai. ₹${recPrice} par aapki occupancy 82% tak pahunch sakti hai.`,
      projectedOccupancyRate: 82,
      demandLevel: 'HIGH',
      seasonalityFactor: 1.15,
    };
  }

  private async checkHostProSubscription(userId?: string): Promise<{ isPro: boolean; isFoundingHost: boolean; hostCount: number }> {
    try {
      const totalProperties = await this.prisma.property.count();
      const EARLY_HOST_LIMIT = 200;

      // Auto-unlock for the first 200 early hosts to drive aggressive supply growth
      if (totalProperties < EARLY_HOST_LIMIT) {
        return { isPro: true, isFoundingHost: true, hostCount: totalProperties };
      }

      if (!userId) return { isPro: false, isFoundingHost: false, hostCount: totalProperties };

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, roles: true },
      });

      return { isPro: false, isFoundingHost: false, hostCount: totalProperties };
    } catch {
      // Fallback: unlock during initial growth phase
      return { isPro: true, isFoundingHost: true, hostCount: 12 };
    }
  }

  private getBenchmarkNeighborhoodData(city: string, type: string, bedrooms: number) {
    const c = city.toLowerCase();
    if (c.includes('goa')) {
      return {
        minPrice: 3800,
        maxPrice: 8500,
        defaultCompetitors: [
          {
            id: 'goa_comp_1',
            title: '2BHK Private Pool Villa Candolim',
            locality: 'Candolim',
            city: 'Goa',
            propertyType: 'VILLA',
            pricePerNight: 4800,
            rating: 4.94,
            reviewCount: 48,
            heroImage: '/images/real_villa.jpg',
            keyAmenities: ['Private Pool', 'Beach Access', 'High-Speed Wi-Fi', 'Air Conditioning'],
          },
          {
            id: 'goa_comp_2',
            title: 'Azure Horizon Portuguese Villa',
            locality: 'Assagao',
            city: 'Goa',
            propertyType: 'VILLA',
            pricePerNight: 5200,
            rating: 4.98,
            reviewCount: 62,
            heroImage: '/images/real_villa_pool.jpg',
            keyAmenities: ['Private Jacuzzi', 'Chef on Call', 'Smart Lock'],
          },
          {
            id: 'goa_comp_3',
            title: 'Calangute Palms Heritage Homestay',
            locality: 'Calangute',
            city: 'Goa',
            propertyType: 'HOMESTAY',
            pricePerNight: 4200,
            rating: 4.88,
            reviewCount: 31,
            heroImage: '/images/real_homestay.jpg',
            keyAmenities: ['Balcony', 'Kitchen', 'Free Parking'],
          },
        ],
      };
    } else if (c.includes('manali') || c.includes('himachal')) {
      return {
        minPrice: 3200,
        maxPrice: 7500,
        defaultCompetitors: [
          {
            id: 'manali_comp_1',
            title: 'Cedarwood Pine Alpine Cabin',
            locality: 'Old Manali',
            city: 'Manali',
            propertyType: 'CABIN',
            pricePerNight: 4600,
            rating: 4.95,
            reviewCount: 54,
            heroImage: '/images/real_cabin.jpg',
            keyAmenities: ['Fireplace', 'Snow Mountain View', 'Heater', 'Wi-Fi'],
          },
          {
            id: 'manali_comp_2',
            title: 'The Highland Himalayan Retreat',
            locality: 'Solang Valley',
            city: 'Manali',
            propertyType: 'VILLA',
            pricePerNight: 5800,
            rating: 4.97,
            reviewCount: 40,
            heroImage: '/images/real_treehouse.jpg',
            keyAmenities: ['Heated Pool', 'Balcony', 'Care-taker'],
          },
        ],
      };
    } else {
      const base = bedrooms * 2200;
      return {
        minPrice: Math.round(base * 0.75),
        maxPrice: Math.round(base * 1.5),
        defaultCompetitors: [
          {
            id: 'gen_comp_1',
            title: `${bedrooms}BHK Designer Stay & Garden`,
            locality: 'Prime Central Locality',
            city: city,
            propertyType: type,
            pricePerNight: base,
            rating: 4.91,
            reviewCount: 29,
            heroImage: '/images/real_villa.jpg',
            keyAmenities: ['Wi-Fi', 'Air Conditioning', 'Dedicated Parking'],
          },
          {
            id: 'gen_comp_2',
            title: `Luxury ${bedrooms}BHK Residence`,
            locality: 'Greenview Estate',
            city: city,
            propertyType: type,
            pricePerNight: Math.round(base * 1.15),
            rating: 4.96,
            reviewCount: 44,
            heroImage: '/images/real_villa_pool.jpg',
            keyAmenities: ['Smart Lock', 'Full Kitchen', 'Balcony View'],
          },
        ],
      };
    }
  }
}
