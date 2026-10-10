import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';

export interface HostPlan {
  id: string;
  name: string;
  tagline: string;
  price: number;
  billingPeriod: 'MONTHLY' | 'ANNUAL';
  savingsText?: string;
  badge?: string;
  features: string[];
}

export const HOST_PLANS: HostPlan[] = [
  {
    id: 'HOST_PRO_MONTHLY',
    name: 'StayQ Host Pro (Monthly)',
    tagline: 'Comparable listing details',
    price: 999,
    billingPeriod: 'MONTHLY',
    features: [
      'Unmasked details of comparable active StayQ listings',
      '30-day access to comparable listing details',
    ],
  },
  {
    id: 'HOST_PRO_ANNUAL',
    name: 'StayQ Host Pro (Annual)',
    tagline: 'Comparable listing details for one year',
    price: 7999,
    billingPeriod: 'ANNUAL',
    features: [
      'Unmasked details of comparable active StayQ listings',
      '365-day access to comparable listing details',
    ],
  },
];

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async getPlansList(): Promise<HostPlan[]> {
    try {
      const setting = await this.prisma.adminSetting.findUnique({
        where: { key: 'subscriptions.host_plans' },
      });
      if (setting && setting.value) {
        const parsed = JSON.parse(setting.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e: any) {
      this.logger.warn('Failed to load custom subscription plans from settings, using defaults: ' + e?.message);
    }
    return HOST_PLANS;
  }

  async getPlans() {
    const plans = await this.getPlansList();
    return {
      success: true,
      plans,
    };
  }

  async updatePlans(plans: HostPlan[], adminId?: string) {
    if (!Array.isArray(plans) || plans.length === 0) {
      throw new BadRequestException('At least one subscription plan is required');
    }
    for (const p of plans) {
      if (!p.id || !p.name || typeof p.price !== 'number' || p.price <= 0) {
        throw new BadRequestException(`Invalid plan configuration for ${p.id || 'unnamed plan'}`);
      }
    }
    await this.prisma.adminSetting.upsert({
      where: { key: 'subscriptions.host_plans' },
      create: {
        key: 'subscriptions.host_plans',
        value: JSON.stringify(plans),
        group: 'subscriptions',
        label: 'StayQ Host Pro Subscription Plans',
        description: 'Pricing and tier configuration for host subscriptions',
        updatedById: adminId || null,
      },
      update: {
        value: JSON.stringify(plans),
        updatedById: adminId || null,
      },
    });
    return {
      success: true,
      message: 'Subscription plans updated successfully',
      plans,
    };
  }

  /**
   * BL-059: Reject invalid plan IDs (no silent fallback to monthly)
   */
  async createSubscriptionOrder(params: {
    planId: string;
    userId?: string;
    userEmail?: string;
    userPhone?: string;
    userName?: string;
    idempotencyKey?: string;
  }) {
    const plans = await this.getPlansList();
    const plan = plans.find((p) => p.id === params.planId);
    if (!plan) throw new BadRequestException('Invalid subscription plan');
    const user = await this.prisma.user.findUnique({
      where: { id: params.userId || '' },
    });
    if (!user) throw new NotFoundException('User not found');
    const order = await this.paymentsService.createCashfreeOrder({
      amount: plan.price,
      authenticatedUser: user,
      purpose: 'HOST_PRO',
      referenceId: user.id,
      sku: plan.id,
      idempotencyKey: params.idempotencyKey,
    });
    return { ...order, planId: plan.id, planName: plan.name };
  }

  /**
   * BL-057, BL-058, BL-060: Verify subscription payment and persist entitlement
   */
  async verifySubscription(params: {
    orderId: string;
    planId: string;
    userId?: string;
  }) {
    const plans = await this.getPlansList();
    const plan = plans.find((p) => p.id === params.planId);
    if (!plan) throw new BadRequestException('Invalid subscription plan');
    const user = await this.prisma.user.findUnique({
      where: { id: params.userId || '' },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.paymentsService.consumePaidOrder(
      params.orderId,
      user,
      'HOST_PRO',
      user.id,
      plan.id,
      async (tx, order) => {
        await tx.$queryRaw`SELECT id FROM "User" WHERE id=${user.id} FOR UPDATE`;
        const current = await tx.user.findUniqueOrThrow({
          where: { id: user.id },
        });
        const now = new Date();
        const base =
          current.hostProExpiresAt && current.hostProExpiresAt > now
            ? current.hostProExpiresAt
            : now;
        const expiresAt = new Date(
          base.getTime() +
            (plan.billingPeriod === 'ANNUAL' ? 365 : 30) * 86400000,
        );
        await tx.user.update({
          where: { id: user.id },
          data: {
            isHostPro: true,
            hostProPlanId: plan.id,
            hostProExpiresAt: expiresAt,
          },
        });
        return {
          success: true,
          orderId: order.orderId,
          isPaid: true,
          isActive: true,
          status: 'ACTIVE',
          planId: plan.id,
          isProSubscriber: true,
          activatedAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          subscription: {
            status: 'ACTIVE',
            planId: plan.id,
            expiresAt: expiresAt.toISOString(),
          },
        };
      },
    );
  }
}
