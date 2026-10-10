import { Public } from '../../common/decorators/public.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PropertiesBoostService } from './properties-boost.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Properties / Sponsored Boost')
@Controller('properties')
export class PropertiesBoostController {
  constructor(private readonly boostService: PropertiesBoostService) {}

  /**
   * Get available Boost tiers (₹299 / ₹499 / ₹999)
   * GET /api/v1/properties/boost/tiers
   */
  @Public()
  @Get('boost/tiers')
  getTiers() {
    return this.boostService.getTiers();
  }

  /**
   * Get boost status of a property
   * GET /api/v1/properties/:id/boost/status
   */
  @Get(':id/boost/status')
  getBoostStatus(@Param('id') id: string, @CurrentUser() user: any) {
    return this.boostService.getPropertyBoostStatus(id, user);
  }

  /**
   * Create Cashfree PG checkout order for Property Boost
   * POST /api/v1/properties/:id/boost/checkout
   */
  @Post(':id/boost/checkout')
  @UseGuards(FirebaseAuthGuard)
  createCheckout(
    @Headers('idempotency-key') key: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { tierId: string },
  ) {
    return this.boostService.createBoostCheckout(id, body.tierId, user, key);
  }

  /**
   * Activate Boost after payment verification
   * POST /api/v1/properties/:id/boost/activate
   */
  @Post(':id/boost/activate')
  @UseGuards(FirebaseAuthGuard)
  activateBoost(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { tierId: string; orderId: string; paymentId?: string },
  ) {
    return this.boostService.activateBoost(id, body.tierId, user, {
      orderId: body.orderId,
      paymentId: body.paymentId,
    });
  }
}
