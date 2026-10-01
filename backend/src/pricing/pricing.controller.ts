import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { PricingService } from './pricing.service';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('market-intelligence')
  async getMarketIntelligence(
    @Body()
    body: {
      city: string;
      locality?: string;
      propertyType?: string;
      bedrooms?: number;
      currentPrice?: number;
      amenities?: string[];
      userId?: string;
    },
  ) {
    return this.pricingService.getMarketIntelligence(body);
  }

  @Get('market-intelligence')
  async getMarketIntelligenceGet(
    @Query('city') city: string,
    @Query('locality') locality?: string,
    @Query('propertyType') propertyType?: string,
    @Query('bedrooms') bedrooms?: string,
    @Query('currentPrice') currentPrice?: string,
    @Query('userId') userId?: string,
  ) {
    return this.pricingService.getMarketIntelligence({
      city: city || 'Goa',
      locality,
      propertyType: propertyType || 'VILLA',
      bedrooms: bedrooms ? parseInt(bedrooms, 10) : 2,
      currentPrice: currentPrice ? parseFloat(currentPrice) : 5000,
      userId,
    });
  }
}
