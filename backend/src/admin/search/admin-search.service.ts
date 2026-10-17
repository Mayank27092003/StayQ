import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, Prisma } from '@prisma/client';

export interface SearchResultItem {
  id: string;
  type: 'USER' | 'HOST' | 'TRANSACTION' | 'BOOKING' | 'PROPERTY';
  title: string;
  subtitle: string;
  meta: Record<string, any>;
}

export interface UniversalSearchResults {
  query: string;
  totalHits: number;
  users: SearchResultItem[];
  hosts: SearchResultItem[];
  transactions: SearchResultItem[];
  properties: SearchResultItem[];
  bookings: SearchResultItem[];
}

@Injectable()
export class AdminSearchService {
  constructor(private readonly prisma: PrismaService) {}

  private extractPhoneVariants(raw: string): string[] {
    const digitsOnly = raw.replace(/\D/g, '');
    const variants = new Set<string>();

    if (raw.trim()) variants.add(raw.trim());
    if (digitsOnly.length >= 5) {
      variants.add(digitsOnly);
      if (digitsOnly.length > 10) {
        variants.add(digitsOnly.slice(-10));
      }
      if (digitsOnly.length === 10) {
        variants.add(`+91${digitsOnly}`);
        variants.add(`+91 ${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}`);
      }
    }
    return Array.from(variants);
  }

  async search(query: string, typeFilter: string = 'all'): Promise<UniversalSearchResults> {
    const q = (query || '').trim();
    if (!q || q.length < 2) {
      return {
        query: q,
        totalHits: 0,
        users: [],
        hosts: [],
        transactions: [],
        properties: [],
        bookings: [],
      };
    }

    const phoneVariants = this.extractPhoneVariants(q);
    const now = new Date();

    const userSearchConditions: Prisma.UserWhereInput[] = [
      { displayName: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { referralCode: { contains: q, mode: 'insensitive' } },
      { hostCode: { contains: q, mode: 'insensitive' } },
      { location: { contains: q, mode: 'insensitive' } },
    ];

    for (const pv of phoneVariants) {
      userSearchConditions.push({ phone: { contains: pv, mode: 'insensitive' } });
    }

    const [matchedUsers, matchedOrders, matchedProperties, matchedBookings] = await Promise.all([
      // 1. Search Users & Hosts
      typeFilter === 'all' || typeFilter === 'users' || typeFilter === 'hosts'
        ? this.prisma.user.findMany({
            where: {
              OR: userSearchConditions,
              deletedAt: null,
            },
            take: 20,
            include: {
              payoutAccount: {
                select: { verified: true, bankName: true, govIdType: true },
              },
              loyaltyProfile: {
                select: { availablePoints: true, tier: true },
              },
              _count: {
                select: { properties: true, bookingsAsGuest: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          })
        : [],

      // 2. Search Gateway Orders & Transactions
      typeFilter === 'all' || typeFilter === 'transactions'
        ? this.prisma.gatewayOrder.findMany({
            where: {
              OR: [
                { orderId: { contains: q, mode: 'insensitive' } },
                { paymentReference: { contains: q, mode: 'insensitive' } },
                { purpose: { contains: q, mode: 'insensitive' } },
                { sku: { contains: q, mode: 'insensitive' } },
                { ownerId: q },
              ],
            },
            take: 20,
            orderBy: { createdAt: 'desc' },
          })
        : [],

      // 3. Search Properties
      typeFilter === 'all' || typeFilter === 'properties'
        ? this.prisma.property.findMany({
            where: {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { city: { contains: q, mode: 'insensitive' } },
                { state: { contains: q, mode: 'insensitive' } },
              ],
            },
            take: 15,
            select: {
              id: true,
              title: true,
              type: true,
              status: true,
              city: true,
              state: true,
              pricePerNight: true,
              host: {
                select: { id: true, displayName: true, phone: true, email: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          })
        : [],

      // 4. Search Bookings
      typeFilter === 'all' || typeFilter === 'bookings'
        ? this.prisma.booking.findMany({
            where: {
              OR: [
                { id: { contains: q, mode: 'insensitive' } },
                { confirmationCode: { contains: q, mode: 'insensitive' } },
                { guest: { displayName: { contains: q, mode: 'insensitive' } } },
                { guest: { phone: { contains: q, mode: 'insensitive' } } },
                { guest: { email: { contains: q, mode: 'insensitive' } } },
              ],
            },
            take: 15,
            include: {
              property: { select: { id: true, title: true, city: true } },
              guest: { select: { id: true, displayName: true, phone: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
          })
        : [],
    ]);

    const usersList: SearchResultItem[] = [];
    const hostsList: SearchResultItem[] = [];

    for (const u of matchedUsers) {
      const isHost = u.roles.includes(UserRole.HOST) || (u._count?.properties ?? 0) > 0;
      const isProActive = Boolean(u.isHostPro && (!u.hostProExpiresAt || u.hostProExpiresAt > now));

      const item: SearchResultItem = {
        id: u.id,
        type: (isHost ? 'HOST' : 'USER') as 'HOST' | 'USER',
        title: u.displayName || (isHost ? 'Host Partner' : 'Guest User'),
        subtitle: `${u.phone || 'No phone'} • ${u.email || 'No email'}`,
        meta: {
          phone: u.phone,
          email: u.email,
          location: u.location,
          roles: u.roles,
          isHost,
          isHostPro: isProActive,
          hostProPlanId: u.hostProPlanId,
          hostProExpiresAt: u.hostProExpiresAt?.toISOString() || null,
          hostCode: u.hostCode,
          isHostVerified: u.isHostVerified,
          kycStatus: u.payoutAccount?.verified ? 'VERIFIED' : (u.payoutAccount ? 'PENDING' : 'NOT_SUBMITTED'),
          loyaltyPoints: u.loyaltyProfile?.availablePoints ?? 0,
          totalListings: u._count.properties,
          totalBookings: u._count.bookingsAsGuest,
          createdAt: u.createdAt.toISOString(),
        },
      };

      if (isHost && (typeFilter === 'all' || typeFilter === 'hosts')) {
        hostsList.push(item);
      } else if (!isHost && (typeFilter === 'all' || typeFilter === 'users')) {
        usersList.push(item);
      }
    }

    const transactionsList: SearchResultItem[] = matchedOrders.map((o) => ({
      id: o.id,
      type: 'TRANSACTION' as const,
      title: `${o.purpose.replace(/_/g, ' ')} • ₹${Number(o.amount).toLocaleString('en-IN')}`,
      subtitle: `Order: ${o.orderId} • Status: ${o.status}`,
      meta: {
        orderId: o.orderId,
        purpose: o.purpose,
        sku: o.sku,
        amount: Number(o.amount),
        currency: o.currency,
        status: o.status,
        ownerId: o.ownerId,
        paymentReference: o.paymentReference,
        paidAt: o.paidAt?.toISOString() || null,
        createdAt: o.createdAt.toISOString(),
      },
    }));

    const propertiesList: SearchResultItem[] = matchedProperties.map((p) => ({
      id: p.id,
      type: 'PROPERTY' as const,
      title: p.title,
      subtitle: `${p.type} • ${p.city}, ${p.state} • ₹${Number(p.pricePerNight).toLocaleString('en-IN')}/night`,
      meta: {
        status: p.status,
        city: p.city,
        state: p.state,
        pricePerNight: Number(p.pricePerNight),
        hostName: p.host.displayName,
        hostPhone: p.host.phone,
        hostEmail: p.host.email,
      },
    }));

    const bookingsList: SearchResultItem[] = matchedBookings.map((b) => ({
      id: b.id,
      type: 'BOOKING' as const,
      title: `Booking at ${b.property.title}`,
      subtitle: `Guest: ${b.guest?.displayName || 'Guest'} (${b.guest?.phone || '—'}) • Status: ${b.status}`,
      meta: {
        confirmationCode: b.confirmationCode,
        status: b.status,
        totalAmount: Number(b.totalAmount),
        checkIn: b.checkIn.toISOString(),
        checkOut: b.checkOut.toISOString(),
        guestName: b.guest?.displayName,
        guestPhone: b.guest?.phone,
        propertyTitle: b.property.title,
        propertyCity: b.property.city,
      },
    }));

    const totalHits =
      usersList.length +
      hostsList.length +
      transactionsList.length +
      propertiesList.length +
      bookingsList.length;

    return {
      query: q,
      totalHits,
      users: usersList,
      hosts: hostsList,
      transactions: transactionsList,
      properties: propertiesList,
      bookings: bookingsList,
    };
  }
}
