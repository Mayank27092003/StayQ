import { Public } from '../common/decorators/public.decorator';
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { SubscriptionsService, HostPlan } from './subscriptions.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subService: SubscriptionsService) {}

  @Public()
  @Get('host-plans')
  getPlans() {
    return this.subService.getPlans();
  }

  @Public()
  @Get('plans')
  getAllPlans() {
    return this.subService.getPlans();
  }

  @Get('admin/plans')
  @UseGuards(FirebaseAuthGuard)
  getAdminPlans() {
    return this.subService.getPlans();
  }

  @Put('admin/plans')
  @UseGuards(FirebaseAuthGuard)
  updateAdminPlans(
    @CurrentUser() user: any,
    @Body() body: { plans: HostPlan[] },
  ) {
    return this.subService.updatePlans(body.plans, user?.id);
  }

  @Post('create-order')
  @UseGuards(FirebaseAuthGuard)
  createOrder(
    @Headers('idempotency-key') key: string,
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
    return this.subService.createSubscriptionOrder({
      ...body,
      userId: user.id,
      idempotencyKey: key,
    });
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
