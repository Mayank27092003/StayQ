import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subService: SubscriptionsService) {}

  @Get('host-plans')
  getPlans() {
    return this.subService.getPlans();
  }

  @Post('create-order')
  @UseGuards(FirebaseAuthGuard)
  createOrder(
    @CurrentUser() user: any,
    @Body()
    body: {
      planId: string;
      userId?: string;
      userEmail?: string;
      userPhone?: string;
      userName?: string;
    },
  ) {
    body.userId = user.id;
    return this.subService.createSubscriptionOrder(body);
  }

  @Post('verify')
  @UseGuards(FirebaseAuthGuard)
  verifySubscription(
    @CurrentUser() user: any,
    @Body()
    body: {
      orderId: string;
      planId: string;
      userId?: string;
    },
  ) {
    body.userId = user.id;
    return this.subService.verifySubscription(body);
  }
}
