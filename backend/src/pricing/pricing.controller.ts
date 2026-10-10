import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PricingService } from './pricing.service';
@Controller('pricing')
export class PricingController {
  constructor(private pricing: PricingService) {}
  @Post('market-intelligence')
  post(@CurrentUser('id') id: string, @Body() body: any) {
    return this.pricing.getMarketIntelligence({ ...body, userId: id });
  }
  @Get('market-intelligence')
  get(@CurrentUser('id') id: string, @Query() q: any) {
    return this.pricing.getMarketIntelligence({
      ...q,
      userId: id,
      bedrooms: q.bedrooms === undefined ? undefined : Number(q.bedrooms),
      currentPrice:
        q.currentPrice === undefined ? undefined : Number(q.currentPrice),
    });
  }
}
