import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  Headers,
} from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { LoyaltyService } from './loyalty.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { LoyaltyTier } from '@prisma/client';

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  /**
   * Public: Get all tiers & perks catalog.
   */
  @Public()
  @Get('tiers')
  getTiers() {
    return {
      success: true,
      tiers: this.loyaltyService.getAllTiers(),
    };
  }

  /**
   * Protected: Get current user's loyalty profile, points, multiplier, and recent history.
   */
  @Get('profile')
  @UseGuards(FirebaseAuthGuard)
  async getProfile(@Req() req: any) {
    const userId = req.user.id;
    const profile = await this.loyaltyService.getOrCreateProfile(userId);
    return {
      success: true,
      profile,
    };
  }

  /**
   * Protected: Get paginated points transactions history.
   */
  @Get('history')
  @UseGuards(FirebaseAuthGuard)
  async getHistory(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const userId = req.user.id;
    const result = await this.loyaltyService.getPointsHistory(
      userId,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
    );
    return {
      success: true,
      ...result,
    };
  }

  /**
   * Protected: Redeem points for StayQ Credit (500 pts = ₹250).
   */
  @Post('redeem')
  @UseGuards(FirebaseAuthGuard)
  async redeemPoints(
    @Req() req: any,
    @Body() body: { points: number },
    @Headers('idempotency-key') key: string,
  ) {
    const userId = req.user.id;
    return this.loyaltyService.redeemPoints(userId, body.points, key);
  }

  /**
   * Protected: Upgrade membership tier (Q_PLUS or Q_PREMIUM).
   */
  @Post('upgrade-tier/create-order')
  @UseGuards(FirebaseAuthGuard)
  createTierOrder(
    @Req() req: any,
    @Body() body: { tier: LoyaltyTier },
    @Headers('idempotency-key') key: string,
  ) {
    return this.loyaltyService.createTierOrder(req.user.id, body.tier, key);
  }

  @Post('upgrade-tier')
  @UseGuards(FirebaseAuthGuard)
  async upgradeTier(
    @Req() req: any,
    @Body() body: { tier: LoyaltyTier; orderId: string },
  ) {
    const userId = req.user.id;
    return this.loyaltyService.upgradeTier(userId, body.tier, body.orderId);
  }

  /**
   * Protected: Claim profile completion bonus.
   */
  @Post('claim-profile-bonus')
  @UseGuards(FirebaseAuthGuard)
  async claimProfileBonus(@Req() req: any) {
    const userId = req.user.id;
    const result =
      await this.loyaltyService.awardProfileCompletionPoints(userId);
    return {
      success: true,
      profile: result,
    };
  }
}
