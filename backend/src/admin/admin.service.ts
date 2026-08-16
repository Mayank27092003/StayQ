import { Injectable } from '@nestjs/common';
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
      select: { id: true, email: true, displayName: true, roles: true, isAdmin: true, adminRole: true, createdAt: true },
    });
  }

  async updateUserRole(userId: string, roles: UserRole[]) {
    return this.prisma.user.update({ where: { id: userId }, data: { roles } });
  }

  async getAuditLogs(query: AuditQuery = {}) {
    const where: Prisma.AdminAuditLogWhereInput = {};
    if (query.action) where.action = { contains: query.action, mode: 'insensitive' };
    if (query.targetType) where.targetType = query.targetType;
    if (query.targetId) where.targetId = query.targetId;
    if (query.adminId) where.adminId = query.adminId;

    return this.prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(200, Math.max(1, query.limit ?? 50)),
      include: { admin: { select: { id: true, displayName: true, email: true } } },
    });
  }

  async getAllProperties() {
    return this.prisma.property.findMany({
      orderBy: { createdAt: 'desc' },
      include: { host: { select: { id: true, displayName: true, email: true } } },
    });
  }

  async updatePropertyStatus(id: string, status: PropertyStatus, adminId: string) {
    const updated = await this.prisma.property.update({ where: { id }, data: { status } });
    await this.prisma.adminAuditLog.create({
      data: { adminId, action: 'UPDATE_PROPERTY_STATUS', targetType: 'PROPERTY', targetId: id, details: { newStatus: status } },
    });
    return updated;
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
