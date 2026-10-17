import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface TransactionRecord {
  id: string;
  orderId: string;
  purpose: 'HOST_PRO' | 'PROPERTY_BOOST' | 'BOOKING' | string;
  typeLabel: string;
  sku: string | null;
  amount: number;
  currency: string;
  status: 'PAID' | 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'FAILED' | string;
  paymentReference: string | null;
  paidAt: string | null;
  createdAt: string;
  // Expiry & Validity Tracking (Requested by User)
  startDate: string | null;
  expiresAt: string | null;
  daysRemaining: number | null;
  isExpired: boolean;
  expiryFormatted: string;
  // Customer Dossier
  customer: {
    id: string;
    displayName: string;
    email: string;
    phone: string;
    photoUrl: string | null;
    roles: string[];
    hostCode: string | null;
    isHostVerified: boolean;
  };
  // Associated Property (if Boost or Booking)
  property?: {
    id: string;
    title: string;
    city: string;
    type: string;
    thumbnailUrl?: string | null;
  } | null;
}

export interface TransactionSummaryStats {
  totalRevenue: number;
  hostProTotalRevenue: number;
  hostProMrr: number;
  propertyBoostRevenue: number;
  bookingsRevenue: number;
  platformCommissionEarned: number;
  activeHostProCount: number;
  activeBoostCount: number;
  totalOrdersCount: number;
}

@Injectable()
export class AdminTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  private calculateExpiryDetails(
    purpose: string,
    paidAt: Date | null,
    createdAt: Date,
    userExpiresAt: Date | null,
    boostEndDate?: Date | null,
  ) {
    const now = new Date();
    let startDate: Date | null = paidAt || createdAt;
    let expiresAt: Date | null = null;

    if (purpose === 'HOST_PRO') {
      expiresAt = userExpiresAt;
    } else if (purpose === 'PROPERTY_BOOST' && boostEndDate) {
      expiresAt = boostEndDate;
    }

    if (!expiresAt && purpose === 'HOST_PRO' && startDate) {
      // Default 30 days if not set
      expiresAt = new Date(startDate.getTime() + 30 * 86400000);
    }

    let daysRemaining: number | null = null;
    let isExpired = false;
    let expiryFormatted = 'N/A';

    if (expiresAt) {
      const diffMs = expiresAt.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffMs / 86400000);
      isExpired = daysRemaining <= 0;

      const dateStr = expiresAt.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      if (isExpired) {
        const pastDays = Math.abs(daysRemaining);
        expiryFormatted = `Expired on ${dateStr} (${pastDays}d ago)`;
      } else {
        expiryFormatted = `Expires on ${dateStr} (${daysRemaining}d remaining)`;
      }
    }

    return {
      startDate: startDate?.toISOString() || null,
      expiresAt: expiresAt?.toISOString() || null,
      daysRemaining,
      isExpired,
      expiryFormatted,
    };
  }

  async getTransactions(query: {
    purpose?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 30));
    const skip = (page - 1) * limit;

    const where: Prisma.GatewayOrderWhereInput = {};

    if (query.purpose && query.purpose !== 'ALL') {
      where.purpose = query.purpose;
    }

    if (query.status && query.status !== 'ALL') {
      if (query.status === 'PAID') {
        where.paidAt = { not: null };
      } else if (query.status === 'PENDING') {
        where.paidAt = null;
        where.status = { not: 'FAILED' };
      } else {
        where.status = query.status;
      }
    }

    const searchQuery = (query.search || '').trim();
    if (searchQuery) {
      where.OR = [
        { orderId: { contains: searchQuery, mode: 'insensitive' } },
        { paymentReference: { contains: searchQuery, mode: 'insensitive' } },
        { sku: { contains: searchQuery, mode: 'insensitive' } },
        { ownerId: searchQuery },
      ];
    }

    const [total, orders] = await Promise.all([
      this.prisma.gatewayOrder.count({ where }),
      this.prisma.gatewayOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Fetch buyer user details and property details
    const ownerIds = Array.from(new Set(orders.map((o) => o.ownerId)));
    const referenceIds = orders
      .filter((o) => o.purpose === 'PROPERTY_BOOST' || o.purpose === 'BOOKING')
      .map((o) => o.referenceId);

    const [users, properties, propertyBoosts] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: ownerIds } },
        select: {
          id: true,
          displayName: true,
          email: true,
          phone: true,
          photoUrl: true,
          roles: true,
          hostCode: true,
          isHostVerified: true,
          isHostPro: true,
          hostProExpiresAt: true,
        },
      }),
      this.prisma.property.findMany({
        where: { id: { in: referenceIds } },
        select: {
          id: true,
          title: true,
          city: true,
          type: true,
          images: { select: { url: true }, take: 1 },
        },
      }),
      this.prisma.propertyBoost.findMany({
        where: { orderId: { in: orders.map((o) => o.orderId) } },
        select: { orderId: true, propertyId: true, tier: true, tierName: true, endDate: true },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const propertyMap = new Map(properties.map((p) => [p.id, p]));
    const boostMap = new Map(propertyBoosts.map((b) => [b.orderId || '', b]));

    const items: TransactionRecord[] = orders.map((o) => {
      const user = userMap.get(o.ownerId);
      const boost = boostMap.get(o.orderId);
      const property = propertyMap.get(o.referenceId);

      // Determine label
      let typeLabel = o.purpose.replace(/_/g, ' ');
      if (o.purpose === 'HOST_PRO') {
        typeLabel = o.sku === 'HOST_PRO_ANNUAL' ? '⭐ Host Pro (Annual)' : '💎 Host Pro (Monthly)';
      } else if (o.purpose === 'PROPERTY_BOOST') {
        typeLabel = boost?.tierName || '⚡ Property Spotlight Boost';
      } else if (o.purpose === 'BOOKING') {
        typeLabel = '🏡 Stay & Experience Reservation';
      }

      // Compute expiry
      const expiry = this.calculateExpiryDetails(
        o.purpose,
        o.paidAt,
        o.createdAt,
        user?.hostProExpiresAt || null,
        boost?.endDate || null,
      );

      // Determine status
      let finalStatus = o.status;
      if (o.paidAt) {
        finalStatus = expiry.isExpired ? 'EXPIRED' : 'PAID';
      }

      return {
        id: o.id,
        orderId: o.orderId,
        purpose: o.purpose,
        typeLabel,
        sku: o.sku,
        amount: Number(o.amount),
        currency: o.currency,
        status: finalStatus,
        paymentReference: o.paymentReference,
        paidAt: o.paidAt?.toISOString() || null,
        createdAt: o.createdAt.toISOString(),
        startDate: expiry.startDate,
        expiresAt: expiry.expiresAt,
        daysRemaining: expiry.daysRemaining,
        isExpired: expiry.isExpired,
        expiryFormatted: expiry.expiryFormatted,
        customer: {
          id: o.ownerId,
          displayName: user?.displayName || 'Registered Customer',
          email: user?.email || '—',
          phone: user?.phone || '—',
          photoUrl: user?.photoUrl || null,
          roles: user?.roles || ['GUEST'],
          hostCode: user?.hostCode || null,
          isHostVerified: user?.isHostVerified || false,
        },
        property: property ? {
          id: property.id,
          title: property.title,
          city: property.city,
          type: property.type,
          thumbnailUrl: (property as any).images?.[0]?.url || null,
        } : null,
      };
    });

    return {
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      transactions: items,
    };
  }

  async getTransactionStats(): Promise<TransactionSummaryStats> {
    const now = new Date();

    const [paidOrders, activeHostProUsers, activeBoosts] = await Promise.all([
      this.prisma.gatewayOrder.findMany({
        where: { paidAt: { not: null } },
        select: { purpose: true, sku: true, amount: true },
      }),
      this.prisma.user.findMany({
        where: {
          isHostPro: true,
          OR: [{ hostProExpiresAt: null }, { hostProExpiresAt: { gt: now } }],
        },
        select: { hostProPlanId: true },
      }),
      this.prisma.propertyBoost.count({
        where: { status: 'ACTIVE', endDate: { gt: now } },
      }),
    ]);

    let totalRevenue = 0;
    let hostProTotalRevenue = 0;
    let propertyBoostRevenue = 0;
    let bookingsRevenue = 0;

    for (const o of paidOrders) {
      const amt = Number(o.amount);
      totalRevenue += amt;
      if (o.purpose === 'HOST_PRO') hostProTotalRevenue += amt;
      else if (o.purpose === 'PROPERTY_BOOST') propertyBoostRevenue += amt;
      else if (o.purpose === 'BOOKING') bookingsRevenue += amt;
    }

    // Monthly Recurring Revenue estimate
    let hostProMrr = 0;
    for (const u of activeHostProUsers) {
      if (u.hostProPlanId === 'HOST_PRO_ANNUAL') {
        hostProMrr += 7999 / 12; // amortized monthly
      } else {
        hostProMrr += 999;
      }
    }

    const platformCommissionEarned = bookingsRevenue * 0.1; // 10% platform fee

    return {
      totalRevenue: Math.round(totalRevenue),
      hostProTotalRevenue: Math.round(hostProTotalRevenue),
      hostProMrr: Math.round(hostProMrr),
      propertyBoostRevenue: Math.round(propertyBoostRevenue),
      bookingsRevenue: Math.round(bookingsRevenue),
      platformCommissionEarned: Math.round(platformCommissionEarned),
      activeHostProCount: activeHostProUsers.length,
      activeBoostCount: activeBoosts,
      totalOrdersCount: paidOrders.length,
    };
  }

  async getTransactionDetail(orderId: string) {
    const order = await this.prisma.gatewayOrder.findUnique({
      where: { orderId },
    });
    if (!order) throw new NotFoundException('Transaction order not found');

    const user = await this.prisma.user.findUnique({
      where: { id: order.ownerId },
      include: {
        payoutAccount: true,
        loyaltyProfile: true,
      },
    });

    return {
      success: true,
      order,
      customer: user,
    };
  }
}
