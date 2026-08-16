import { Injectable } from '@nestjs/common';

@Injectable()
export class DynamicPricingService {
  calculatePrice(basePrice: number, demandMultiplier: number): number {
    return basePrice * demandMultiplier;
  }
}
