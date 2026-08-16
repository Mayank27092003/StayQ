import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  BookingStatus,
  HostStatus,
  PayoutStatus,
  Prisma,
  PropertyStatus,
  UserRole,
  NotificationType,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditService } from '../audit/admin-audit.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { buildPaginatedResult, PaginatedResult, toSkipTake } from '../dto/pagination.dto';
import { decimalToNumber, roundCurrency, roundRate, sumDecimals } from '../common/serialization';
import { HostQueryDto, UpdateHostStatusDto, UpdateSuperhostDto } from './dto/host.dto';

const REVENUE_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.CONFIRMED,
  BookingStatus.COMPLETED,
];

export interface HostListItem {
  id: string;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  location: string | null;
  isSuperhost: boolean;
  /** Null until an admin has made a lifecycle decision about this host. */
  hostStatus: HostStatus | null;
  hostStatusReason: string | null;
  hostStatusUpdatedAt: Date | null;
  responseRate: number | null;
  responseTime: number | null;
  createdAt: Date;
  propertyCount: number;
  activePropertyCount: number;
  payoutAccountVerified: boolean | null;
  payoutAccountName: string | null;
}

@Injectable()
export class AdminHostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(query: HostQueryDto): Promise<PaginatedResult<HostListItem>> {
    const { skip, take } = toSkipTake(query);

    // A host is any user carrying the HOST role. Property ownership alone is not
    // used, so a host who has not published yet still appears.
    const where: Prisma.UserWhereInput = { roles: { has: UserRole.HOST } };

    if (query.hostStatus) where.hostStatus = query.hostStatus;
    if (query.isSuperhost !== undefined) where.isSuperhost = query.isSuperhost;
    if (query.propertyStatus) {
      where.properties = { some: { status: query.propertyStatus } };
    }
    if (query.search) {
      where.OR = [
        { displayName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [hosts, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          displayName: true,
          email: true,
          phone: true,
          photoUrl: true,
          location: true,
          isSuperhost: true,
          hostStatus: true,
          hostStatusReason: true,
          hostStatusUpdatedAt: true,
          responseRate: true,
          responseTime: true,
          createdAt: true,
          payoutAccount: { select: { verified: true, accountHolderName: true } },
          _count: { select: { properties: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Active listing counts in one grouped query rather than per-host lookups.
    const hostIds = hosts.map((host) => host.id);
    const activeCounts = hostIds.length
      ? await this.prisma.property.groupBy({
          by: ['hostId'],
          where: { hostId: { in: hostIds }, status: PropertyStatus.ACTIVE },
          _count: { _all: true },
        })
      : [];
    const activeByHost = new Map(activeCounts.map((row) => [row.hostId, row._count._all]));

    const data: HostListItem[] = hosts.map((host) => ({
      id: host.id,
      displayName: host.displayName,
      email: host.email,
      phone: host.phone,
      photoUrl: host.photoUrl,
      location: host.location,
      isSuperhost: host.isSuperhost,
      hostStatus: host.hostStatus,
      hostStatusReason: host.hostStatusReason,
      hostStatusUpdatedAt: host.hostStatusUpdatedAt,
      responseRate: roundRate(host.responseRate),
      responseTime: host.responseTime,
      createdAt: host.createdAt,
      propertyCount: host._count.properties,
      activePropertyCount: activeByHost.get(host.id) ?? 0,
      // Null distinguishes "no payout account on file" from "on file, unverified".
      payoutAccountVerified: host.payoutAccount ? host.payoutAccount.verified : null,
      payoutAccountName: host.payoutAccount ? host.payoutAccount.accountHolderName : null,
    }));

    return buildPaginatedResult(data, total, query);
  }

  /**
   * Full host profile. Every metric is aggregated from real properties,
   * bookings, earnings, and reviews; nothing is defaulted to a placeholder.
   */
  async findOne(hostId: string) {
    const host = await this.prisma.user.findUnique({
      where: { id: hostId },
      select: {
        id: true,
        displayName: true,
        email: true,
        phone: true,
        photoUrl: true,
        bio: true,
        location: true,
        roles: true,
        isSuperhost: true,
        hostStatus: true,
        hostStatusReason: true,
        hostStatusUpdatedAt: true,
        responseRate: true,
        responseTime: true,
        createdAt: true,
        payoutAccount: {
          select: {
            bankName: true,
            accountHolderName: true,
            ifscCode: true,
            verified: true,
            verifiedAt: true,
            govIdType: true,
            // Account and government id numbers are deliberately excluded.
          },
        },
      },
    });

    if (!host) throw new NotFoundException('Host not found.');
    if (!host.roles.includes(UserRole.HOST)) {
      throw new BadRequestException('This account does not hold the HOST role.');
    }

    const [properties, propertyStatusCounts, bookingAgg, earnings, reviewAgg] = await Promise.all([
      this.prisma.property.findMany({
        where: { hostId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          city: true,
          status: true,
          category: true,
          pricePerNight: true,
          createdAt: true,
          _count: { select: { bookings: true, reviews: true } },
        },
      }),
      this.prisma.property.groupBy({
        by: ['status'],
        where: { hostId },
        _count: { _all: true },
      }),
      this.prisma.booking.aggregate({
        where: { property: { hostId }, status: { in: REVENUE_BOOKING_STATUSES } },
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.hostEarning.findMany({
        where: { hostId },
        select: { netPayout: true, grossAmount: true, platformFee: true, payoutStatus: true },
      }),
      this.prisma.review.aggregate({
        where: { property: { hostId } },
        _count: { _all: true },
        _avg: { rating: true },
      }),
    ]);

    const cancelledCount = await this.prisma.booking.count({
      where: { property: { hostId }, status: BookingStatus.CANCELLED },
    });

    const paidOut = earnings.filter((e) => e.payoutStatus === PayoutStatus.COMPLETED);
    const pendingPayout = earnings.filter((e) => e.payoutStatus !== PayoutStatus.COMPLETED);

    return {
      ...host,
      responseRate: roundRate(host.responseRate),
      properties: properties.map((property) => ({
        ...property,
        pricePerNight: decimalToNumber(property.pricePerNight),
        bookingCount: property._count.bookings,
        reviewCount: property._count.reviews,
        _count: undefined,
      })),
      metrics: {
        propertyCount: properties.length,
        propertiesByStatus: Object.fromEntries(
          propertyStatusCounts.map((row) => [row.status, row._count._all]),
        ),
        completedBookings: bookingAgg._count._all,
        cancelledBookings: cancelledCount,
        grossBookingValue: roundCurrency(decimalToNumber(bookingAgg._sum.totalAmount) ?? 0),
        lifetimeNetPayout: roundCurrency(sumDecimals(earnings.map((e) => e.netPayout))),
        paidOutAmount: roundCurrency(sumDecimals(paidOut.map((e) => e.netPayout))),
        pendingPayoutAmount: roundCurrency(sumDecimals(pendingPayout.map((e) => e.netPayout))),
        platformFeesCollected: roundCurrency(sumDecimals(earnings.map((e) => e.platformFee))),
        reviewCount: reviewAgg._count._all,
        // Null when no reviews exist, rather than reporting a 0.0 rating.
        averageRating:
          reviewAgg._count._all === 0 ? null : roundRate(reviewAgg._avg.rating ?? null),
      },
    };
  }

  async updateStatus(hostId: string, dto: UpdateHostStatusDto, adminId: string) {
    const host = await this.prisma.user.findUnique({
      where: { id: hostId },
      select: { id: true, roles: true, hostStatus: true },
    });
    if (!host) throw new NotFoundException('Host not found.');
    if (!host.roles.includes(UserRole.HOST)) {
      throw new BadRequestException('This account does not hold the HOST role.');
    }
    if (dto.hostStatus === HostStatus.SUSPENDED && !dto.reason) {
      throw new BadRequestException('A reason is required when suspending a host.');
    }

    const updated = await this.audit.runWithAudit(
      async (tx) => {
        const user = await tx.user.update({
          where: { id: hostId },
          data: {
            hostStatus: dto.hostStatus,
            hostStatusReason: dto.reason ?? null,
            hostStatusUpdatedAt: new Date(),
            hostStatusUpdatedById: adminId,
          },
          select: {
            id: true,
            hostStatus: true,
            hostStatusReason: true,
            hostStatusUpdatedAt: true,
          },
        });

        // Suspension pauses the host's live inventory so guests cannot book a
        // listing from a host who is no longer permitted to operate.
        let pausedProperties = 0;
        if (dto.hostStatus === HostStatus.SUSPENDED) {
          const result = await tx.property.updateMany({
            where: { hostId, status: PropertyStatus.ACTIVE },
            data: { status: PropertyStatus.PAUSED },
          });
          pausedProperties = result.count;
        }

        return { ...user, pausedProperties };
      },
      (result) => ({
        adminId,
        action: 'UPDATE_HOST_STATUS',
        targetType: 'HOST',
        targetId: hostId,
        details: {
          previousStatus: host.hostStatus,
          newStatus: result.hostStatus,
          reason: dto.reason ?? null,
          pausedProperties: result.pausedProperties,
        },
      }),
    );

    return updated;
  }

  async updateSuperhost(hostId: string, dto: UpdateSuperhostDto, adminId: string) {
    const host = await this.prisma.user.findUnique({
      where: { id: hostId },
      select: { id: true, roles: true, isSuperhost: true },
    });
    if (!host) throw new NotFoundException('Host not found.');
    if (!host.roles.includes(UserRole.HOST)) {
      throw new BadRequestException('This account does not hold the HOST role.');
    }

    return this.audit.runWithAudit(
      (tx) =>
        tx.user.update({
          where: { id: hostId },
          data: { isSuperhost: dto.isSuperhost },
          select: { id: true, isSuperhost: true },
        }),
      (result) => ({
        adminId,
        action: dto.isSuperhost ? 'GRANT_STARHOST' : 'REVOKE_STARHOST',
        targetType: 'HOST',
        targetId: hostId,
        details: {
          previous: host.isSuperhost,
          current: result.isSuperhost,
          reason: dto.reason ?? null,
        },
      }),
    );
  }

  async summary() {
    const hostWhere: Prisma.UserWhereInput = { roles: { has: UserRole.HOST } };

    const [total, superhosts, byStatus, awaitingReview, verifiedPayouts] = await Promise.all([
      this.prisma.user.count({ where: hostWhere }),
      this.prisma.user.count({ where: { ...hostWhere, isSuperhost: true } }),
      this.prisma.user.groupBy({
        by: ['hostStatus'],
        where: hostWhere,
        _count: { _all: true },
      }),
      this.prisma.property.count({ where: { status: PropertyStatus.PENDING_REVIEW } }),
      this.prisma.hostPayoutAccount.count({ where: { verified: true } }),
    ]);

    return {
      totalHosts: total,
      starhosts: superhosts,
      superhosts,
      // `null` keys represent hosts with no recorded lifecycle decision yet.
      byStatus: Object.fromEntries(
        byStatus.map((row) => [row.hostStatus ?? 'UNREVIEWED', row._count._all]),
      ),
      propertiesAwaitingReview: awaitingReview,
      verifiedPayoutAccounts: verifiedPayouts,
    };
  }

  async sendImprovementNotice(hostId: string, adminId: string) {
    const host = await this.prisma.user.findUnique({
      where: { id: hostId },
      select: { id: true, roles: true, displayName: true },
    });
    if (!host) throw new NotFoundException('Host not found.');
    if (!host.roles.includes(UserRole.HOST)) {
      throw new BadRequestException('This account does not hold the HOST role.');
    }

    await this.notifications.sendNotification(
      hostId,
      NotificationType.SYSTEM,
      'Action Required: Improve Listing Performance',
      `Hi ${host.displayName || 'Host'}, we noticed your recent performance metrics are below our community standards. Please review your listings and make improvements to avoid suspension.`,
    );

    return this.audit.runWithAudit(
      async () => ({ success: true }),
      () => ({
        adminId,
        action: 'SEND_IMPROVEMENT_NOTICE',
        targetType: 'HOST',
        targetId: hostId,
        details: {},
      }),
    );
  }
}
