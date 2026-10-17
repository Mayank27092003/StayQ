import {
  assertPublishable,
  assertListingDocuments,
} from '../common/publication.util';
import { DomainStateMachine } from '../common/state-machines/domain-state-machines';
import { text } from '../common/utils/input.util';
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, PropertyStatus, Prisma } from '@prisma/client';

interface AuditQuery {
  limit?: number;
  action?: string;
  targetType?: string;
  targetId?: string;
  adminId?: string;
}

@Injectable()
export class AdminService {
  async reviewDocuments(
    id: string,
    approved: boolean,
    note: string,
    actor: any,
  ) {
    if (
      !actor?.isAdmin ||
      !['SUPER_ADMIN', 'TRUST_SAFETY'].includes(actor.adminRole)
    )
      throw new ForbiddenException('Trust and safety role required');
    if (typeof approved !== 'boolean')
      throw new BadRequestException('A boolean review decision is required');
    text(note, 'Review note', 2000);
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Property" WHERE id=${id} FOR UPDATE`;
      const p = await tx.property.findUnique({ where: { id } });
      if (!p) throw new NotFoundException('Property not found');
      if (approved) assertListingDocuments(p);
      const r = await tx.property.update({
        where: { id },
        data: {
          propertyDocsVerified: approved,
          propertyDocsVerifiedAt: approved ? new Date() : null,
          ...(!approved && p.status === 'ACTIVE'
            ? { status: 'PENDING_REVIEW' as const }
            : {}),
        },
      });
      await tx.adminAuditLog.create({
        data: {
          adminId: actor.id,
          action: 'REVIEW_PROPERTY_DOCUMENTS',
          targetType: 'PROPERTY',
          targetId: id,
          details: { approved, note },
        },
      });
      return r;
    });
  }

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [usersCount, propertiesCount, bookingsCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.property.count(),
      this.prisma.booking.count(),
    ]);
    return { usersCount, propertiesCount, bookingsCount };
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        displayName: true,
        roles: true,
        isAdmin: true,
        adminRole: true,
        createdAt: true,
      },
    });
  }

  async getRegisteredUsers(query: { search?: string; limit?: number } = {}) {
    const where: Prisma.UserWhereInput = {};
    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      where.OR = [
        { displayName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { referralCode: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(200, Math.max(1, Number(query.limit) || 100)),
      select: {
        id: true,
        displayName: true,
        email: true,
        phone: true,
        location: true,
        gender: true,
        dob: true,
        roles: true,
        referralCode: true,
        emailVerified: true,
        phoneVerified: true,
        isHostVerified: true,
        createdAt: true,
        deviceTokens: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: {
            platform: true,
            updatedAt: true,
          },
        },
        payoutAccount: {
          select: {
            verified: true,
            govIdType: true,
            bankName: true,
          },
        },
        loyaltyProfile: {
          select: {
            availablePoints: true,
            totalPoints: true,
            tier: true,
          },
        },
        _count: {
          select: {
            bookingsAsGuest: true,
            properties: true,
          },
        },
      },
    });

    return users.map((u) => {
      const primaryDevice = u.deviceTokens[0];
      const platform = primaryDevice?.platform || 'android';
      return {
        id: u.id,
        displayName: u.displayName || 'Guest User',
        email: u.email || '—',
        phone: u.phone || '—',
        location: u.location || 'India (Auto-detected)',
        gender: u.gender || '—',
        dob: u.dob ? u.dob.toISOString() : null,
        roles: u.roles,
        referralCode: u.referralCode || '—',
        createdAt: u.createdAt,
        platform: platform.toLowerCase(),
        emailVerified: u.emailVerified,
        phoneVerified: u.phoneVerified,
        isHostVerified: u.isHostVerified,
        kycStatus: u.payoutAccount?.verified
          ? 'VERIFIED'
          : u.payoutAccount
            ? 'PENDING'
            : 'NOT_SUBMITTED',
        govIdType: u.payoutAccount?.govIdType || 'None',
        loyaltyPoints: u.loyaltyProfile?.availablePoints ?? 0,
        loyaltyTier: u.loyaltyProfile?.tier ?? 'Q_STARTER',
        totalBookings: u._count.bookingsAsGuest,
        totalListings: u._count.properties,
      };
    });
  }

  async updateUserRole(userId: string, roles: UserRole[], adminId: string) {
    if (
      !Array.isArray(roles) ||
      roles.some((r) => !Object.values(UserRole).includes(r))
    )
      throw new BadRequestException('Invalid user roles');
    return this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: { roles: [...new Set(roles)] },
      });
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'UPDATE_USER_ROLES',
          targetType: 'USER',
          targetId: userId,
          details: { roles },
        },
      });
      return u;
    });
  }

  async getAuditLogs(query: AuditQuery = {}) {
    const where: Prisma.AdminAuditLogWhereInput = {};
    if (query.action)
      where.action = { contains: query.action, mode: 'insensitive' };
    if (query.targetType) where.targetType = query.targetType;
    if (query.targetId) where.targetId = query.targetId;
    if (query.adminId) where.adminId = query.adminId;

    return this.prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(200, Math.max(1, query.limit ?? 50)),
      include: {
        admin: { select: { id: true, displayName: true, email: true } },
      },
    });
  }

  async getAllProperties() {
    return this.prisma.property.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        host: { select: { id: true, displayName: true, email: true } },
      },
    });
  }

  async updatePropertyStatus(
    id: string,
    status: PropertyStatus,
    adminId: string,
  ) {
    if (!Object.values(PropertyStatus).includes(status))
      throw new BadRequestException('Invalid property status');
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Property" WHERE id=${id} FOR UPDATE`;
      const p = await tx.property.findUnique({
        where: { id },
        include: { host: { include: { payoutAccount: true } }, images: true },
      });
      if (!p) throw new NotFoundException('Property not found');
      DomainStateMachine.assertPropertyTransition(p.status, status, true);
      if (status === 'ACTIVE') assertPublishable(p);
      const result = await tx.property.update({
        where: { id },
        data: { status },
      });
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'UPDATE_PROPERTY_STATUS',
          targetType: 'PROPERTY',
          targetId: id,
          details: { previousStatus: p.status, newStatus: status },
        },
      });
      return result;
    });
  }

  async getAllBookings() {
    return this.prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        guest: { select: { id: true, displayName: true } },
        property: { select: { id: true, title: true } },
      },
    });
  }

  // ─── USER 360 DEEP DOSSIER ────────────────────────────────────────────────

  async getUser360(userId: string) {
    const now = new Date();
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        payoutAccount: true,
        loyaltyProfile: true,
        deviceTokens: { orderBy: { updatedAt: 'desc' }, take: 3 },
        bookingsAsGuest: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            property: { select: { id: true, title: true, city: true, type: true } },
          },
        },
        properties: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, title: true, type: true, status: true, city: true, pricePerNight: true },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    // Fetch user's gateway orders (Cashfree)
    const orders = await this.prisma.gatewayOrder.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });

    // Compute Host Pro expiry
    let proDaysRemaining: number | null = null;
    let isProExpired = true;
    let proExpiryFormatted = 'No active subscription';

    if (user.isHostPro && user.hostProExpiresAt) {
      const diffMs = user.hostProExpiresAt.getTime() - now.getTime();
      proDaysRemaining = Math.ceil(diffMs / 86400000);
      isProExpired = proDaysRemaining <= 0;
      const dateStr = user.hostProExpiresAt.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      proExpiryFormatted = isProExpired
        ? `Expired on ${dateStr} (${Math.abs(proDaysRemaining)}d ago)`
        : `Active until ${dateStr} (${proDaysRemaining}d remaining)`;
    } else if (user.isHostPro) {
      isProExpired = false;
      proExpiryFormatted = 'Active (Lifetime VIP)';
    }

    // Mask bank account
    let maskedBank = 'Not Linked';
    if (user.payoutAccount?.accountNumber) {
      maskedBank = `•••• •••• ${user.payoutAccount.accountNumber.slice(-4)}`;
    }

    // Compute total spend
    let totalSpent = 0;
    for (const b of user.bookingsAsGuest) {
      if (b.status === 'CONFIRMED' || b.status === 'COMPLETED') {
        totalSpent += Number(b.totalAmount);
      }
    }

    return {
      success: true,
      user: {
        id: user.id,
        displayName: user.displayName || 'Guest User',
        email: user.email || '—',
        phone: user.phone || '—',
        photoUrl: user.photoUrl,
        bio: user.bio,
        location: user.location,
        gender: user.gender,
        dob: user.dob ? user.dob.toISOString() : null,
        roles: user.roles,
        createdAt: user.createdAt.toISOString(),
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        isHostVerified: user.isHostVerified,
        hostCode: user.hostCode,
        isSuperhost: user.isSuperhost,
        isStarhost: user.isStarhost,
        hostStatus: user.hostStatus || 'ACTIVE',
        hostStatusReason: user.hostStatusReason,
        // Host Pro details with expiry
        isHostPro: user.isHostPro && !isProExpired,
        hostProPlanId: user.hostProPlanId,
        hostProExpiresAt: user.hostProExpiresAt?.toISOString() || null,
        proDaysRemaining,
        isProExpired,
        proExpiryFormatted,
        // KYC & Bank Details
        kyc: {
          status: user.payoutAccount?.verified ? 'VERIFIED' : (user.payoutAccount ? 'PENDING' : 'NOT_SUBMITTED'),
          govIdType: user.payoutAccount?.govIdType || 'Aadhaar / Passport',
          bankName: user.payoutAccount?.bankName || '—',
          beneficiaryName: user.payoutAccount?.accountHolderName || user.displayName || '—',
          accountNumberMasked: maskedBank,
          ifsc: user.payoutAccount?.ifscCode || '—',
        },
        // Loyalty
        loyalty: {
          points: user.loyaltyProfile?.availablePoints ?? 0,
          tier: user.loyaltyProfile?.tier ?? 'Q_STARTER',
          referralCode: user.referralCode || '—',
        },
        // Devices
        devices: user.deviceTokens.map((d) => ({
          platform: d.platform,
          lastActive: d.updatedAt.toISOString(),
        })),
        // Metrics
        stats: {
          totalSpent,
          totalBookingsCount: user.bookingsAsGuest.length,
          totalListingsCount: user.properties.length,
        },
        // Recent Bookings
        bookings: user.bookingsAsGuest.map((b) => ({
          id: b.id,
          propertyTitle: b.property.title,
          propertyCity: b.property.city,
          type: b.property.type,
          startDate: b.checkIn.toISOString(),
          endDate: b.checkOut.toISOString(),
          totalAmount: Number(b.totalAmount),
          status: b.status,
          confirmationCode: b.confirmationCode,
          accessPin: b.accessPin,
        })),
        // Recent Orders
        orders: orders.map((o) => ({
          id: o.id,
          orderId: o.orderId,
          purpose: o.purpose,
          sku: o.sku,
          amount: Number(o.amount),
          status: o.status,
          paymentReference: o.paymentReference,
          paidAt: o.paidAt?.toISOString() || null,
          createdAt: o.createdAt.toISOString(),
        })),
        // Properties (if host)
        properties: user.properties.map((p) => ({
          id: p.id,
          title: p.title,
          type: p.type,
          status: p.status,
          city: p.city,
          pricePerNight: Number(p.pricePerNight),
        })),
      },
    };
  }

  // ─── HOST 360 DEEP DOSSIER ────────────────────────────────────────────────

  async getHost360(hostId: string) {
    const user360 = await this.getUser360(hostId);
    const now = new Date();

    // Fetch active property boosts
    const boosts = await this.prisma.propertyBoost.findMany({
      where: { hostId },
      include: {
        property: { select: { id: true, title: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const activeBoosts = boosts.map((b) => {
      const diffMs = b.endDate.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffMs / 86400000));
      return {
        id: b.id,
        propertyTitle: b.property.title,
        propertyCity: b.property.city,
        tier: b.tier,
        tierName: b.tierName,
        amount: Number(b.amount),
        startDate: b.startDate.toISOString(),
        endDate: b.endDate.toISOString(),
        daysRemaining,
        isActive: b.status === 'ACTIVE' && b.endDate > now,
      };
    });

    return {
      ...user360,
      hostExtras: {
        activeBoosts,
        superhostStanding: user360.user.isSuperhost,
        starhostStanding: user360.user.isStarhost,
      },
    };
  }

  // ─── ADMIN VIP ACTION: GRANT HOST PRO ────────────────────────────────────

  async grantHostPro(userId: string, days: number = 30, planId: string = 'HOST_PRO_MONTHLY', adminId: string = 'admin') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const now = new Date();
    const base = user.hostProExpiresAt && user.hostProExpiresAt > now ? user.hostProExpiresAt : now;
    const newExpiresAt = new Date(base.getTime() + Math.max(1, days) * 86400000);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isHostPro: true,
        hostProPlanId: planId,
        hostProExpiresAt: newExpiresAt,
      },
    });

    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'GRANT_HOST_PRO_VIP',
        targetType: 'USER',
        targetId: userId,
        details: { days, planId, newExpiresAt: newExpiresAt.toISOString() },
      },
    });

    return {
      success: true,
      message: `Successfully granted ${days} days of ${planId} to ${updated.displayName || 'Host'}`,
      isHostPro: true,
      hostProExpiresAt: newExpiresAt.toISOString(),
    };
  }

  // ─── ADMIN ACTION: FREEZE / UNFREEZE ACCOUNT ──────────────────────────────

  async freezeAccount(userId: string, freeze: boolean, reason: string = 'Admin safety policy', adminId: string = 'admin') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const newStatus = freeze ? 'SUSPENDED' : 'APPROVED';

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          hostStatus: newStatus as any,
          hostStatusReason: reason,
          hostStatusUpdatedAt: new Date(),
          hostStatusUpdatedById: adminId,
        },
      });

      // If suspended, pause host's active properties
      if (freeze) {
        await tx.property.updateMany({
          where: { hostId: userId, status: 'ACTIVE' },
          data: { status: 'PAUSED' },
        });
      }

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: freeze ? 'FREEZE_USER_ACCOUNT' : 'UNFREEZE_USER_ACCOUNT',
          targetType: 'USER',
          targetId: userId,
          details: { freeze, reason },
        },
      });
    });

    return {
      success: true,
      message: freeze ? 'Account frozen and active listings paused' : 'Account unfreezed successfully',
      status: newStatus,
    };
  }

  // ─── LIVE PLATFORM PULSE ACTIVITY STREAM ─────────────────────────────────

  async getLiveActivity() {
    const [recentOrders, recentBookings, recentUsers] = await Promise.all([
      this.prisma.gatewayOrder.findMany({
        where: { paidAt: { not: null } },
        orderBy: { paidAt: 'desc' },
        take: 12,
      }),
      this.prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        take: 12,
        include: {
          property: { select: { title: true, city: true } },
          guest: { select: { displayName: true } },
        },
      }),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, displayName: true, email: true, phone: true, roles: true, createdAt: true },
      }),
    ]);

    const events: any[] = [];

    for (const o of recentOrders) {
      events.push({
        id: `ord_${o.id}`,
        type: o.purpose === 'HOST_PRO' ? 'SUBSCRIPTION' : 'PAYMENT',
        title: o.purpose === 'HOST_PRO' ? 'Host Pro Upgraded' : (o.purpose === 'PROPERTY_BOOST' ? 'Property Boost Activated' : 'Booking Paid'),
        description: `Order ${o.orderId} paid ₹${Number(o.amount).toLocaleString('en-IN')}`,
        timestamp: o.paidAt?.toISOString() || o.createdAt.toISOString(),
        icon: o.purpose === 'HOST_PRO' ? 'star' : 'payments',
        badgeColor: 'emerald',
      });
    }

    for (const b of recentBookings) {
      events.push({
        id: `bk_${b.id}`,
        type: 'BOOKING',
        title: `Reservation at ${b.property.title}`,
        description: `Guest: ${b.guest?.displayName || 'Guest'} in ${b.property.city} (₹${Number(b.totalAmount).toLocaleString('en-IN')})`,
        timestamp: b.createdAt.toISOString(),
        icon: 'hotel',
        badgeColor: 'purple',
      });
    }

    for (const u of recentUsers) {
      events.push({
        id: `usr_${u.id}`,
        type: 'REGISTRATION',
        title: u.roles.includes('HOST' as any) ? 'New Host Registered' : 'New Guest Signed Up',
        description: `${u.displayName || 'User'} (${u.phone || u.email || 'Mobile'})`,
        timestamp: u.createdAt.toISOString(),
        icon: 'person_add',
        badgeColor: 'blue',
      });
    }

    // Sort chronologically
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      success: true,
      events: events.slice(0, 20),
    };
  }
}
