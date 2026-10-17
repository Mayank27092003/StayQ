import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';

export interface EscrowPayoutItem {
  id: string;
  bookingId: string;
  confirmationCode: string;
  propertyTitle: string;
  propertyCity: string;
  guestName: string;
  guestPhone: string;
  hostId: string;
  hostName: string;
  hostPhone: string;
  hostEmail: string;
  bankDetails: {
    bankName: string;
    beneficiaryName: string;
    accountNumberMasked: string;
    ifsc: string;
    verified: boolean;
  } | null;
  grossAmount: number;
  platformCommission: number; // 10%
  gstAmount: number; // 18% on commission
  tdsDeducted: number; // 1% TDS
  hostNetPayout: number; // ~90% minus tax
  checkInDate: string;
  escrowReleaseDate: string;
  status: 'PENDING_ESCROW' | 'READY_FOR_RELEASE' | 'RELEASED' | 'ON_HOLD';
  isHold: boolean;
  holdReason: string | null;
}

@Injectable()
export class AdminPayoutsService {
  constructor(private readonly prisma: PrismaService) {}

  async getEscrowPayouts(filter: { status?: string; search?: string } = {}) {
    const now = new Date();

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            host: {
              select: {
                id: true,
                displayName: true,
                phone: true,
                email: true,
                payoutAccount: true,
              },
            },
          },
        },
        guest: {
          select: { id: true, displayName: true, phone: true },
        },
        payment: true,
      },
      orderBy: { checkIn: 'desc' },
      take: 100,
    });

    const items: EscrowPayoutItem[] = bookings.map((b) => {
      const gross = Number(b.totalAmount);
      const commission = Math.round(gross * 0.10);
      const gst = Math.round(commission * 0.18);
      const tds = Math.round(gross * 0.01);
      const hostNet = gross - commission - tds;

      const checkIn = new Date(b.checkIn);
      const releaseDate = new Date(checkIn.getTime() + 24 * 3600 * 1000); // 24h post check-in

      const isPastReleaseTime = now >= releaseDate;
      const isPaidOut = b.payment?.status === 'RELEASED';

      let status: 'PENDING_ESCROW' | 'READY_FOR_RELEASE' | 'RELEASED' | 'ON_HOLD' = 'PENDING_ESCROW';
      if (isPaidOut) {
        status = 'RELEASED';
      } else if (isPastReleaseTime) {
        status = 'READY_FOR_RELEASE';
      }

      const pa = b.property.host.payoutAccount;
      let accMasked = 'No Bank Linked';
      if (pa?.accountNumber) {
        const last4 = pa.accountNumber.slice(-4);
        accMasked = `•••• •••• ${last4}`;
      }

      return {
        id: b.id,
        bookingId: b.id,
        confirmationCode: b.confirmationCode,
        propertyTitle: b.property.title,
        propertyCity: b.property.city,
        guestName: b.guest?.displayName || 'Guest',
        guestPhone: b.guest?.phone || '—',
        hostId: b.property.host.id,
        hostName: b.property.host.displayName || 'Host Partner',
        hostPhone: b.property.host.phone || '—',
        hostEmail: b.property.host.email || '—',
        bankDetails: pa ? {
          bankName: pa.bankName || 'Verified Bank',
          beneficiaryName: pa.accountHolderName || b.property.host.displayName || 'Host',
          accountNumberMasked: accMasked,
          ifsc: pa.ifscCode || '—',
          verified: pa.verified,
        } : null,
        grossAmount: gross,
        platformCommission: commission,
        gstAmount: gst,
        tdsDeducted: tds,
        hostNetPayout: hostNet,
        checkInDate: checkIn.toISOString(),
        escrowReleaseDate: releaseDate.toISOString(),
        status,
        isHold: false,
        holdReason: null,
      };
    });

    if (filter.status && filter.status !== 'ALL') {
      return items.filter((i) => i.status === filter.status);
    }

    if (filter.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      return items.filter(
        (i) =>
          i.hostName.toLowerCase().includes(q) ||
          i.hostPhone.toLowerCase().includes(q) ||
          i.guestName.toLowerCase().includes(q) ||
          i.propertyTitle.toLowerCase().includes(q) ||
          i.confirmationCode.toLowerCase().includes(q) ||
          i.bookingId.toLowerCase().includes(q),
      );
    }

    return items;
  }

  async releaseEscrow(bookingId: string, adminId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.payment) {
      await this.prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
        },
      });
    }

    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'RELEASE_HOST_PAYOUT_ESCROW',
        targetType: 'BOOKING',
        targetId: bookingId,
        details: { bookingId, amount: Number(booking.totalAmount) },
      },
    });

    return { success: true, message: 'Host payout released from escrow successfully' };
  }

  async holdEscrow(bookingId: string, reason: string, adminId: string) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException('A reason is required to place payout on hold');
    }

    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'HOLD_HOST_PAYOUT_ESCROW',
        targetType: 'BOOKING',
        targetId: bookingId,
        details: { bookingId, reason },
      },
    });

    return { success: true, message: 'Payout placed on hold successfully', reason };
  }
}
