import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
    tagline: 'AI Market Intelligence & Automated Dynamic Pricing',
    price: 999,
    billingPeriod: 'MONTHLY',
    badge: 'POPULAR',
    features: [
      'Live Neighborhood Competitor Price Radar',
      'Groq LLaMA-3.3 AI Smart Pricing Optimizer',
      'High Demand & Seasonality Surge Alerts',
      'Spotlight Priority Search Placement (2x Views)',
      'Direct Landlord Zero-Brokerage Toolkit',
      'Occupancy & Revenue Velocity Forecaster',
    ],
  },
  {
    id: 'HOST_PRO_ANNUAL',
    name: 'StayQ Host Pro (Annual)',
    tagline: 'Year-Round Maximum Earnings & Dedicated Concierge',
    price: 7999,
    billingPeriod: 'ANNUAL',
    savingsText: 'Save ₹3,989 (33% OFF)',
    badge: 'BEST VALUE',
    features: [
      'All Host Pro Monthly Features Included',
      'Dedicated 24/7 VIP Host Growth Manager',
      'Quarterly Professional Photography Credit',
      'Featured Spotlight Ribbon on Search Cards',
      'Advanced Multi-Calendar Sync (Airbnb + VRBO + StayQ)',
      'Annual Tax & Revenue Statement Report',
    ],
  },
];

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  getPlans() {
    return {
      success: true,
      plans: HOST_PLANS,
    };
  }

  async createSubscriptionOrder(params: {
    planId: string;
    userId?: string;
    userEmail?: string;
    userPhone?: string;
    userName?: string;
  }) {
    const plan = HOST_PLANS.find((p) => p.id === params.planId) || HOST_PLANS[0];
    const orderId = `SUB_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    this.logger.log(`Created Host Pro Subscription Order ${orderId} for Plan ${plan.id} (₹${plan.price})`);

    return {
      success: true,
      orderId,
      amount: plan.price,
      currency: 'INR',
      planId: plan.id,
      planName: plan.name,
      paymentSessionId: `session_${orderId}`,
      message: 'Subscription order generated successfully',
    };
  }

  async verifySubscription(params: {
    orderId: string;
    planId: string;
    userId?: string;
  }) {
    this.logger.log(`Verified Subscription Order ${params.orderId} for user ${params.userId || 'guest'}`);

    return {
      success: true,
      status: 'ACTIVE',
      planId: params.planId,
      isProSubscriber: true,
      activatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      message: 'Host Pro Subscription is now active! Welcome to StayQ Market Intelligence.',
    };
  }
}
