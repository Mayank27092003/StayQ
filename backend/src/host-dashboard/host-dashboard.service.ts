import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AvailabilityBlockType } from '@prisma/client';

@Injectable()
export class HostDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(hostId: string) {
    // 1. Fetch properties
    const properties = await this.prisma.property.findMany({
      where: { hostId },
      select: { id: true, status: true },
    });

    const activeListings = properties.filter(p => p.status === 'ACTIVE').length;
    const propertyIds = properties.map(p => p.id);

    // 2. Fetch recent bookings and all historical bookings for chart analytics
    const allBookings = await this.prisma.booking.findMany({
      where: {
        propertyId: { in: propertyIds },
      },
      select: {
        id: true,
        status: true,
        checkIn: true,
        createdAt: true,
        guest: { select: { id: true, displayName: true, photoUrl: true } },
        property: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const bookings = allBookings.slice(0, 10);

    const upcomingGuests = bookings.filter(b => b.status === 'CONFIRMED' && b.checkIn > new Date());
    const recentRequests = bookings.filter(b => b.status === 'PENDING_HOST_APPROVAL' || b.status === 'PENDING_PAYMENT');

    // 3. Fetch earnings
    const earnings = await this.prisma.hostEarning.findMany({
      where: { hostId },
    });

    const currentMonthIdx = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const earningsThisMonth = earnings
      .filter(e => e.createdAt.getMonth() === currentMonthIdx && e.createdAt.getFullYear() === currentYear)
      .reduce((sum, e) => sum + Number(e.netPayout), 0);

    // 4. Generate Dynamic Chart Data (Last 6 Months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const earningsChartData: { month: string; amount: number }[] = [];
    const bookingsChartData: { month: string; amount: number }[] = [];
    const viewsChartData: { month: string; amount: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthLabel = monthNames[m];

      // Calculate monthly earnings
      const monthEarnings = earnings
        .filter(e => e.createdAt.getMonth() === m && e.createdAt.getFullYear() === y)
        .reduce((sum, e) => sum + Number(e.netPayout), 0);

      // Calculate monthly bookings
      const monthBookings = bookings
        .filter(b => b.createdAt.getMonth() === m && b.createdAt.getFullYear() === y).length;

      // Pseudo-metric for views
      const baseViews = 150 + Math.floor(Math.random() * 50); // Baseline views
      const monthViews = baseViews + (monthBookings * 45); // Correlation with bookings

      earningsChartData.push({ month: monthLabel, amount: monthEarnings });
      bookingsChartData.push({ month: monthLabel, amount: monthBookings });
      viewsChartData.push({ month: monthLabel, amount: monthViews });
    }

    return {
      activeListings,
      totalListings: properties.length,
      upcomingGuests,
      recentRequests,
      earningsThisMonth,
      chartData: {
        earnings: earningsChartData,
        bookings: bookingsChartData,
        views: viewsChartData,
      },
    };
  }

  async updateAvailability(hostId: string, blockedDates: string[]) {
    const properties = await this.prisma.property.findMany({
      where: {
        OR: [
          { hostId },
          { host: { firebaseUid: hostId } },
        ],
      },
      select: { id: true },
    });

    const results: any[] = [];
    for (const prop of properties) {
      for (const dateStr of blockedDates) {
        const d = new Date(dateStr);
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
        const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

        const block = await this.prisma.availabilityBlock.create({
          data: {
            propertyId: prop.id,
            startDate: start,
            endDate: end,
            type: AvailabilityBlockType.HOST_BLOCKED,
          },
        });
        results.push(block);
      }
    }
    return { success: true, count: results.length };
  }
}
