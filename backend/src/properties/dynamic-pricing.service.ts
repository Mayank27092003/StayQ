import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class DynamicPricingService {
  calculatePrice(basePrice: number, demandMultiplier: number): number {
    if (
      !Number.isFinite(basePrice) ||
      basePrice < 0 ||
      !Number.isFinite(demandMultiplier) ||
      demandMultiplier <= 0 ||
      demandMultiplier > 10
    )
      throw new BadRequestException('Invalid pricing inputs');
    return Math.round(basePrice * demandMultiplier * 100) / 100;
  }
}
