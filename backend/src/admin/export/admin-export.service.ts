import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminExportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get database record counts across all core tables
   */
  async getStats() {
    const [
      users,
      properties,
      bookings,
      payments,
      earnings,
      reviews,
      supportTickets,
      broadcasts,
      staff,
      coupons,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.property.count(),
      this.prisma.booking.count(),
      this.prisma.payment.count(),
      this.prisma.hostEarning.count(),
      this.prisma.review.count(),
      this.prisma.supportTicket.count(),
      this.prisma.broadcast.count(),
      this.prisma.adminStaff.count(),
      this.prisma.coupon.count(),
    ]);

    return {
      success: true,
      timestamp: new Date().toISOString(),
      counts: {
        users,
        properties,
        bookings,
        payments,
        payouts: earnings,
        reviews,
        supportTickets,
        broadcasts,
        staff,
        coupons,
      },
      totalRecords:
        users +
        properties +
        bookings +
        payments +
        earnings +
        reviews +
        supportTickets +
        broadcasts +
        staff +
        coupons,
    };
  }

  /**
   * Export all database tables into a single unified JSON migration bundle
   */
  async exportAll() {
    const [
      users,
      properties,
      bookings,
      payments,
      earnings,
      reviews,
      supportTickets,
      broadcasts,
      staff,
      coupons,
      adminAudit,
    ] = await Promise.all([
      this.prisma.user.findMany({
        select: {
          id: true,
          firebaseUid: true,
          email: true,
          phone: true,
          displayName: true,
          photoUrl: true,
          location: true,
          roles: true,
          isSuperhost: true,
          isStarhost: true,
          isHostVerified: true,
          referralCode: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.property.findMany({
        include: {
          images: true,
          roomTypes: true,
          tags: true,
          boosts: true,
        },
      }),
      this.prisma.booking.findMany({
        include: {
          payment: true,
        },
      }),
      this.prisma.payment.findMany(),
      this.prisma.hostEarning.findMany(),
      this.prisma.review.findMany(),
      this.prisma.supportTicket.findMany(),
      this.prisma.broadcast.findMany(),
      this.prisma.adminStaff.findMany({
        select: {
          id: true,
          staffId: true,
          fullName: true,
          email: true,
          department: true,
          role: true,
          status: true,
          allowedModules: true,
          phoneNumber: true,
          createdAt: true,
        },
      }),
      this.prisma.coupon.findMany(),
      this.prisma.adminAuditLog.findMany({
        take: 200,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      migrationMetadata: {
        platform: 'StayQ Enterprise',
        version: '2.0.0',
        exportDate: new Date().toISOString(),
        databaseEngine: 'PostgreSQL 16 / Prisma ORM',
        format: 'STAYQ_ADMIN_EXPORT_V1',
        restorableBackup: false,
        recordCounts: {
          users: users.length,
          properties: properties.length,
          bookings: bookings.length,
          payments: payments.length,
          payouts: earnings.length,
          reviews: reviews.length,
          supportTickets: supportTickets.length,
          broadcasts: broadcasts.length,
          staff: staff.length,
          coupons: coupons.length,
        },
      },
      data: {
        users,
        properties,
        bookings,
        payments,
        payouts: earnings,
        reviews,
        supportTickets,
        broadcasts,
        staff,
        coupons,
        adminAudit,
      },
    };
  }

  /**
   * Export specific table as JSON
   */
  async exportTable(tableName: string) {
    let rows: any[] = [];
    switch (tableName.toLowerCase()) {
      case 'users':
        rows = await this.prisma.user.findMany();
        break;
      case 'properties':
        rows = await this.prisma.property.findMany({
          include: { images: true },
        });
        break;
      case 'bookings':
        rows = await this.prisma.booking.findMany({
          include: { payment: true },
        });
        break;
      case 'payments':
        rows = await this.prisma.payment.findMany();
        break;
      case 'payouts':
        rows = await this.prisma.hostEarning.findMany();
        break;
      case 'reviews':
        rows = await this.prisma.review.findMany();
        break;
      case 'broadcasts':
        rows = await this.prisma.broadcast.findMany();
        break;
      case 'staff':
        rows = await this.prisma.adminStaff.findMany();
        break;
      default:
        throw new NotFoundException(
          `Table "${tableName}" not found for export.`,
        );
    }

    rows = rows.map(({ passwordHash, ...safe }) => safe);
    return {
      table: tableName,
      count: rows.length,
      exportedAt: new Date().toISOString(),
      rows,
    };
  }
}
