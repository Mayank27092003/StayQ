import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionService } from '../commission/commission.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class EarningsService {
  private readonly logger = new Logger(EarningsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly commissionService: CommissionService,
  ) {}

  async calculateAndCreateEarning(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Read live commission settings from database
    const settings = await this.commissionService.getSettings();

    // Gross Rental = Subtotal + Cleaning fee
    const grossAmount = Number(booking.subtotal) + Number(booking.cleaningFee || 0);

    // Host commission (dynamic % from settings)
    const hostCommission = Math.round(grossAmount * (settings.hostCommissionPercent / 100));

    // TDS deduction under Section 194-O (dynamic % from settings)
    const tdsDeduction = Math.round(grossAmount * (settings.tdsRatePercent / 100));

    // Total Stay Q platform fee recorded = Guest service fee + Host commission
    const guestServiceFee = Number(booking.serviceFee || Math.round(Number(booking.subtotal) * (settings.guestServiceFeePercent / 100)));
    const totalPlatformRevenue = guestServiceFee + hostCommission;

    const netPayout = grossAmount - hostCommission - tdsDeduction;

    return this.prisma.hostEarning.create({
      data: {
        host: { connect: { id: booking.property.hostId } },
        booking: { connect: { id: bookingId } },
        grossAmount,
        platformFee: totalPlatformRevenue,
        taxDeducted: tdsDeduction,
        netPayout,
        payoutStatus: 'PENDING',
      },
    });
  }

  async getHostEarnings(hostId: string) {
    return this.prisma.hostEarning.findMany({
      where: { hostId },
      orderBy: { createdAt: 'desc' },
      include: { booking: true },
    });
  }

  async releasePayout(earningId: string, reference: string) {
    return this.prisma.hostEarning.update({
      where: { id: earningId },
      data: {
        payoutStatus: 'COMPLETED',
        payoutDate: new Date(),
        payoutReference: reference,
      },
    });
  }
}
