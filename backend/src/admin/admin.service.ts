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
}
