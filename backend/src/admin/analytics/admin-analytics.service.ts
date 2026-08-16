import { BadRequestException, Injectable } from '@nestjs/common';
import { BookingStatus, PaymentStatus, PayoutStatus, PropertyStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { decimalToNumber, roundCurrency, roundRate, sumDecimals } from '../common/serialization';
import {
  AnalyticsGranularity,
  AnalyticsRangeQueryDto,
  TopListQueryDto,
} from './dto/analytics.dto';

/** Bookings that count as realised business. */
const REALISED_STATUSES: BookingStatus[] = [BookingStatus.CONFIRMED, BookingStatus.COMPLETED];
/** Payments where money has actually moved. */
const SETTLED_PAYMENT_STATUSES: PaymentStatus[] = [
  PaymentStatus.CAPTURED,
  PaymentStatus.RELEASED,
];

interface ResolvedRange {
  from: Date;
  to: Date;
  granularity: AnalyticsGranularity;
}

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves an explicit from/to window, falling back to a trailing `days`
   * window. `to` is exclusive-normalised to the end of its day so a same-day
   * range still contains that day's activity.
   */
  private resolveRange(query: AnalyticsRangeQueryDto): ResolvedRange {
    const granularity = query.granularity ?? AnalyticsGranularity.DAY;

    if (query.from || query.to) {
      const from = query.from ? new Date(query.from) : new Date(0);
      const to = query.to ? new Date(query.to) : new Date();
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        throw new BadRequestException('from and to must be valid dates.');
      }
      if (from.getTime() > to.getTime()) {
        throw new BadRequestException('from must be earlier than to.');
      }
      to.setHours(23, 59, 59, 999);
      return { from, to, granularity };
    }

    const days = query.days ?? 30;
    const to = new Date();
    const from = new Date(to.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    from.setHours(0, 0, 0, 0);
    return { from, to, granularity };
  }

  /** Bucket key for a timestamp at the requested granularity. */
  private bucketKey(date: Date, granularity: AnalyticsGranularity): string {
    if (granularity === AnalyticsGranularity.MONTH) {
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    }
    if (granularity === AnalyticsGranularity.WEEK) {
      // ISO-week-aligned: shift to the Monday that starts the week.
      const monday = new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
      );
      const weekday = (monday.getUTCDay() + 6) % 7;
      monday.setUTCDate(monday.getUTCDate() - weekday);
      return monday.toISOString().slice(0, 10);
    }
    return date.toISOString().slice(0, 10);
  }

  /**
   * Pre-seeds every bucket in the range so a series has a continuous axis.
   * Empty buckets are genuine zero-activity periods, not invented points.
   */
  private seedBuckets(range: ResolvedRange): string[] {
    const keys: string[] = [];
    const cursor = new Date(range.from);

    if (range.granularity === AnalyticsGranularity.MONTH) {
      cursor.setUTCDate(1);
      while (cursor.getTime() <= range.to.getTime()) {
        keys.push(this.bucketKey(cursor, range.granularity));
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      }
      return keys;
    }

    const step = range.granularity === AnalyticsGranularity.WEEK ? 7 : 1;
    let key = this.bucketKey(cursor, range.granularity);
    const seen = new Set<string>();
    while (cursor.getTime() <= range.to.getTime()) {
      key = this.bucketKey(cursor, range.granularity);
      if (!seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
      cursor.setUTCDate(cursor.getUTCDate() + step);
    }
    return keys;
  }

  /**
   * Platform overview. Counts are absolute; revenue reflects settled payments
   * only, so pending checkouts are never reported as income.
   */
  async overview(query: AnalyticsRangeQueryDto) {
    const range = this.resolveRange(query);
    const windowFilter = { gte: range.from, lte: range.to };

    const [
      usersTotal,
      usersInWindow,
      hostsTotal,
      propertiesTotal,
      propertiesByStatus,
      bookingsTotal,
      bookingsInWindow,
      bookingsByStatus,
      settledPayments,
      refundAgg,
      earningsAgg,
      reviewAgg,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: windowFilter } }),
      this.prisma.user.count({ where: { roles: { has: 'HOST' } } }),
      this.prisma.property.count(),
      this.prisma.property.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { createdAt: windowFilter } }),
      this.prisma.booking.groupBy({
        by: ['status'],
        where: { createdAt: windowFilter },
        _count: { _all: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: { in: SETTLED_PAYMENT_STATUSES }, createdAt: windowFilter },
        _count: { _all: true },
        _sum: { amount: true, platformCommission: true, hostPayout: true },
      }),
      this.prisma.refund.aggregate({
        where: { createdAt: windowFilter },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      this.prisma.hostEarning.aggregate({
        where: { payoutStatus: { in: [PayoutStatus.PENDING, PayoutStatus.ELIGIBLE] } },
        _sum: { netPayout: true },
      }),
      this.prisma.review.aggregate({ _count: { _all: true }, _avg: { rating: true } }),
    ]);

    const grossRevenue = roundCurrency(decimalToNumber(settledPayments._sum.amount) ?? 0);
    const refunded = roundCurrency(decimalToNumber(refundAgg._sum.amount) ?? 0);

    const realisedInWindow = bookingsByStatus
      .filter((row) => REALISED_STATUSES.includes(row.status))
      .reduce((sum, row) => sum + row._count._all, 0);
    const cancelledInWindow =
      bookingsByStatus.find((row) => row.status === BookingStatus.CANCELLED)?._count._all ?? 0;
    const decidedInWindow = realisedInWindow + cancelledInWindow;

    return {
      range: { from: range.from, to: range.to, granularity: range.granularity },
      users: { total: usersTotal, newInWindow: usersInWindow, hosts: hostsTotal },
      properties: {
        total: propertiesTotal,
        byStatus: Object.fromEntries(propertiesByStatus.map((r) => [r.status, r._count._all])),
        awaitingReview:
          propertiesByStatus.find((r) => r.status === PropertyStatus.PENDING_REVIEW)?._count._all ??
          0,
      },
      bookings: {
        total: bookingsTotal,
        inWindow: bookingsInWindow,
        realisedInWindow,
        cancelledInWindow,
        byStatus: Object.fromEntries(bookingsByStatus.map((r) => [r.status, r._count._all])),
        // Null when nothing was decided in the window, rather than reporting 0%.
        cancellationRate:
          decidedInWindow === 0
            ? null
            : roundRate((cancelledInWindow / decidedInWindow) * 100),
      },
      revenue: {
        settledPaymentCount: settledPayments._count._all,
        grossRevenue,
        platformCommission: roundCurrency(
          decimalToNumber(settledPayments._sum.platformCommission) ?? 0,
        ),
        hostPayouts: roundCurrency(decimalToNumber(settledPayments._sum.hostPayout) ?? 0),
        refundCount: refundAgg._count._all,
        refundedAmount: refunded,
        netRevenue: roundCurrency(grossRevenue - refunded),
        outstandingHostPayouts: roundCurrency(
          decimalToNumber(earningsAgg._sum.netPayout) ?? 0,
        ),
        averageBookingValue:
          settledPayments._count._all === 0
            ? null
            : roundCurrency(grossRevenue / settledPayments._count._all),
      },
      reviews: {
        total: reviewAgg._count._all,
        averageRating: reviewAgg._count._all === 0 ? null : roundRate(reviewAgg._avg.rating ?? null),
      },
    };
  }

  /** Booking and revenue series over the requested window. */
  async timeseries(query: AnalyticsRangeQueryDto) {
    const range = this.resolveRange(query);
    const windowFilter = { gte: range.from, lte: range.to };

    const [bookings, payments, signups] = await Promise.all([
      this.prisma.booking.findMany({
        where: { createdAt: windowFilter },
        select: { createdAt: true, status: true, totalAmount: true },
      }),
      this.prisma.payment.findMany({
        where: { status: { in: SETTLED_PAYMENT_STATUSES }, createdAt: windowFilter },
        select: { createdAt: true, amount: true, platformCommission: true },
      }),
      this.prisma.user.findMany({
        where: { createdAt: windowFilter },
        select: { createdAt: true },
      }),
    ]);

    const buckets = new Map<
      string,
      {
        bookings: number;
        realisedBookings: number;
        cancelledBookings: number;
        bookingValue: number;
        revenue: number;
        commission: number;
        newUsers: number;
      }
    >();

    for (const key of this.seedBuckets(range)) {
      buckets.set(key, {
        bookings: 0,
        realisedBookings: 0,
        cancelledBookings: 0,
        bookingValue: 0,
        revenue: 0,
        commission: 0,
        newUsers: 0,
      });
    }

    const bucketFor = (date: Date) => buckets.get(this.bucketKey(date, range.granularity));

    for (const booking of bookings) {
      const bucket = bucketFor(booking.createdAt);
      if (!bucket) continue;
      bucket.bookings += 1;
      if (REALISED_STATUSES.includes(booking.status)) {
        bucket.realisedBookings += 1;
        bucket.bookingValue += decimalToNumber(booking.totalAmount) ?? 0;
      }
      if (booking.status === BookingStatus.CANCELLED) bucket.cancelledBookings += 1;
    }

    for (const payment of payments) {
      const bucket = bucketFor(payment.createdAt);
      if (!bucket) continue;
      bucket.revenue += decimalToNumber(payment.amount) ?? 0;
      bucket.commission += decimalToNumber(payment.platformCommission) ?? 0;
    }

    for (const user of signups) {
      const bucket = bucketFor(user.createdAt);
      if (bucket) bucket.newUsers += 1;
    }

    return {
      range: { from: range.from, to: range.to, granularity: range.granularity },
      series: [...buckets.entries()].map(([period, value]) => ({
        period,
        bookings: value.bookings,
        realisedBookings: value.realisedBookings,
        cancelledBookings: value.cancelledBookings,
        bookingValue: roundCurrency(value.bookingValue),
        revenue: roundCurrency(value.revenue),
        commission: roundCurrency(value.commission),
        newUsers: value.newUsers,
      })),
    };
  }

  /** Distribution of realised bookings and value across category and city. */
  async breakdown(query: AnalyticsRangeQueryDto) {
    const range = this.resolveRange(query);

    const bookings = await this.prisma.booking.findMany({
      where: {
        createdAt: { gte: range.from, lte: range.to },
        status: { in: REALISED_STATUSES },
      },
      select: {
        totalAmount: true,
        property: { select: { category: true, city: true, type: true } },
      },
    });

    const tally = (key: (b: (typeof bookings)[number]) => string) => {
      const map = new Map<string, { bookings: number; value: number }>();
      for (const booking of bookings) {
        const k = key(booking);
        const entry = map.get(k) ?? { bookings: 0, value: 0 };
        entry.bookings += 1;
        entry.value += decimalToNumber(booking.totalAmount) ?? 0;
        map.set(k, entry);
      }
      return [...map.entries()]
        .map(([name, value]) => ({
          name,
          bookings: value.bookings,
          value: roundCurrency(value.value),
        }))
        .sort((a, b) => b.value - a.value);
    };

    return {
      range: { from: range.from, to: range.to },
      totalRealisedBookings: bookings.length,
      byCategory: tally((b) => b.property.category),
      byCity: tally((b) => b.property.city),
      byPropertyType: tally((b) => b.property.type),
    };
  }

  /** Highest-earning properties in the window, by realised booking value. */
  async topProperties(query: TopListQueryDto) {
    const range = this.resolveRange(query);
    const limit = query.limit ?? 10;

    const grouped = await this.prisma.booking.groupBy({
      by: ['propertyId'],
      where: {
        createdAt: { gte: range.from, lte: range.to },
        status: { in: REALISED_STATUSES },
      },
      _count: { _all: true },
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: limit,
    });

    if (grouped.length === 0) {
      return { range: { from: range.from, to: range.to }, properties: [] };
    }

    const properties = await this.prisma.property.findMany({
      where: { id: { in: grouped.map((row) => row.propertyId) } },
      select: {
        id: true,
        title: true,
        city: true,
        category: true,
        status: true,
        host: { select: { id: true, displayName: true } },
      },
    });
    const byId = new Map(properties.map((property) => [property.id, property]));

    return {
      range: { from: range.from, to: range.to },
      properties: grouped.flatMap((row) => {
        const property = byId.get(row.propertyId);
        if (!property) return [];
        return [
          {
            ...property,
            bookings: row._count._all,
            bookingValue: roundCurrency(decimalToNumber(row._sum.totalAmount) ?? 0),
          },
        ];
      }),
    };
  }

  /** Highest-earning hosts in the window, by net payout recorded. */
  async topHosts(query: TopListQueryDto) {
    const range = this.resolveRange(query);
    const limit = query.limit ?? 10;

    const grouped = await this.prisma.hostEarning.groupBy({
      by: ['hostId'],
      where: { createdAt: { gte: range.from, lte: range.to } },
      _count: { _all: true },
      _sum: { netPayout: true, grossAmount: true, platformFee: true },
      orderBy: { _sum: { netPayout: 'desc' } },
      take: limit,
    });

    if (grouped.length === 0) {
      return { range: { from: range.from, to: range.to }, hosts: [] };
    }

    const hosts = await this.prisma.user.findMany({
      where: { id: { in: grouped.map((row) => row.hostId) } },
      select: { id: true, displayName: true, email: true, isSuperhost: true },
    });
    const byId = new Map(hosts.map((host) => [host.id, host]));

    return {
      range: { from: range.from, to: range.to },
      hosts: grouped.flatMap((row) => {
        const host = byId.get(row.hostId);
        if (!host) return [];
        return [
          {
            ...host,
            earningRecords: row._count._all,
            grossAmount: roundCurrency(decimalToNumber(row._sum.grossAmount) ?? 0),
            platformFee: roundCurrency(decimalToNumber(row._sum.platformFee) ?? 0),
            netPayout: roundCurrency(decimalToNumber(row._sum.netPayout) ?? 0),
          },
        ];
      }),
    };
  }

  /**
   * Revenue detail for the finance view: settled payments, commission, refunds,
   * and payout pipeline state.
   */
  async revenue(query: AnalyticsRangeQueryDto) {
    const range = this.resolveRange(query);
    const windowFilter = { gte: range.from, lte: range.to };

    const [payments, refunds, byPayoutStatus, earningsInWindow] = await Promise.all([
      this.prisma.payment.findMany({
        where: { status: { in: SETTLED_PAYMENT_STATUSES }, createdAt: windowFilter },
        select: {
          amount: true,
          platformCommission: true,
          hostPayout: true,
          status: true,
          currency: true,
        },
      }),
      this.prisma.refund.findMany({
        where: { createdAt: windowFilter },
        select: { amount: true, reason: true, createdAt: true },
      }),
      this.prisma.hostEarning.groupBy({
        by: ['payoutStatus'],
        _count: { _all: true },
        _sum: { netPayout: true },
      }),
      this.prisma.hostEarning.aggregate({
        where: { createdAt: windowFilter },
        _sum: { grossAmount: true, platformFee: true, netPayout: true, taxDeducted: true },
      }),
    ]);

    const gross = roundCurrency(sumDecimals(payments.map((p) => p.amount)));
    const commission = roundCurrency(sumDecimals(payments.map((p) => p.platformCommission)));
    const hostPayouts = roundCurrency(sumDecimals(payments.map((p) => p.hostPayout)));
    const refunded = roundCurrency(sumDecimals(refunds.map((r) => r.amount)));

    return {
      range: { from: range.from, to: range.to },
      // Currency is reported from stored payment rows; null when none settled.
      currency: payments[0]?.currency ?? null,
      settledPayments: payments.length,
      grossRevenue: gross,
      platformCommission: commission,
      hostPayouts,
      refundCount: refunds.length,
      refundedAmount: refunded,
      netPlatformRevenue: roundCurrency(commission - refunded),
      netRevenue: roundCurrency(gross - refunded),
      earningsInWindow: {
        grossAmount: roundCurrency(decimalToNumber(earningsInWindow._sum.grossAmount) ?? 0),
        platformFee: roundCurrency(decimalToNumber(earningsInWindow._sum.platformFee) ?? 0),
        taxDeducted: roundCurrency(decimalToNumber(earningsInWindow._sum.taxDeducted) ?? 0),
        netPayout: roundCurrency(decimalToNumber(earningsInWindow._sum.netPayout) ?? 0),
      },
      payoutPipeline: byPayoutStatus.map((row) => ({
        status: row.payoutStatus,
        count: row._count._all,
        netPayout: roundCurrency(decimalToNumber(row._sum.netPayout) ?? 0),
      })),
    };
  }

  async recentActivity() {
    const recentBookings = await this.prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        property: { select: { title: true, city: true } },
        guest: { select: { displayName: true, email: true } },
      },
    });

    return recentBookings.map((b) => ({
      id: b.id,
      type: 'BOOKING',
      title: b.property?.title || 'Direct Stay Booking',
      subtitle: `Guest: ${b.guest?.displayName || 'Traveler'} (${(b.adults || 1) + (b.children || 0)} guests)`,
      amount: `₹${Number(b.totalAmount || 0).toLocaleString('en-IN')}`,
      status: b.status,
      createdAt: b.createdAt,
    }));
  }
}
