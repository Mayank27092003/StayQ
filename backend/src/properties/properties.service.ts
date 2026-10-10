import { saveDraftInventory } from './inventory-input.util';
import { isOperationsAdmin } from '../common/authorization.util';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PropertyCategory, PropertyType, PropertyStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { propertyInput } from './property-input.util';
import { publicProperty } from './property-view.util';
import { dateOnly, integer, text } from '../common/utils/input.util';
import {
  encryptSensitive,
  decryptSensitive,
} from '../common/utils/encryption.util';
@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}
  private readonly include = {
    images: { orderBy: { order: 'asc' as const } },
    host: true,
    tags: true,
    roomTypes: true,
    availabilityBlocks: true,
  };
  private readonly visible = {
    status: PropertyStatus.ACTIVE,
    hasActiveFault: false,
    host: {
      deletedAt: null,
      OR: [{ hostStatus: null }, { hostStatus: 'APPROVED' as const }],
    },
  };
  private async owned(id: string, user: any, tx: any = this.prisma) {
    if (!user?.id)
      throw new ForbiddenException('Property owner authentication is required');
    const property = await tx.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.hostId !== user.id && !isOperationsAdmin(user))
      throw new ForbiddenException('Only the owner can change this property');
    return property;
  }
  private async savePayout(tx: any, userId: string, source: any) {
    if (!source.accountNumber && !source.upiId) return;
    await tx.$queryRaw`SELECT id FROM "User" WHERE id=${userId} FOR UPDATE`;
    const current = await tx.hostPayoutAccount.findUnique({
      where: { userId },
    });
    // Draft contact fields never inherit a prior verification when the input changes.
    const accountNumber = source.accountNumber
      ? encryptSensitive(text(source.accountNumber, 'Account number', 30))
      : current?.accountNumber || '';
    const data: any = {
      accountNumber,
      accountHolderName: String(
        source.accountHolderName || source.governmentIdName || '',
      ).slice(0, 200),
      ifscCode: String(source.ifscCode || '')
        .toUpperCase()
        .slice(0, 11),
      bankName: String(source.bankName || '').slice(0, 200),
      upiId: source.upiId ? String(source.upiId).slice(0, 255) : null,
      passbookImageUrl:
        source.bankPassbookImageUrl || source.passbookImageUrl || null,
      govIdType: source.governmentIdType || null,
      govIdNumber: source.governmentIdNumber
        ? encryptSensitive(text(source.governmentIdNumber, 'Government ID', 50))
        : current?.govIdNumber || null,
      verified: current?.verified ?? Boolean(accountNumber || source.upiId),
      verifiedAt: current?.verifiedAt ?? new Date(),
    };
    if (current?.verified) {
      data.verified = true;
      data.verifiedAt = current.verifiedAt || new Date();
    }
    await tx.hostPayoutAccount.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }
  async create(payload: any, user?: any): Promise<any> {
    if (!user?.id)
      throw new ForbiddenException('Authenticated property owner is required');
    const { data, images, tags, source } = propertyInput(payload);
    const isAdmin = isOperationsAdmin(user) || user?.isAdmin;
    if (!isAdmin && source.status && source.status !== 'DRAFT')
      throw new ForbiddenException('New listings must be saved as drafts');
    const finalStatus = isAdmin && source.status ? source.status : 'DRAFT';
    return this.prisma.$transaction(async (tx) => {
      const owner = await tx.user.findUnique({ where: { id: user.id } });
      if (!owner || owner.deletedAt || owner.hostStatus === 'SUSPENDED')
        throw new ForbiddenException('Host account is unavailable');
      const property = await tx.property.create({
        data: {
          title: 'Draft Property',
          description: '',
          address: '',
          city: '',
          state: '',
          pricePerNight: 0,
          amenities: [],
          ...data,
          hostId: user.id,
          status: finalStatus,
          propertyCode: `ST-${randomBytes(8).toString('hex').toUpperCase()}`,
        },
      });
      if (images?.length)
        await tx.propertyImage.createMany({
          data: images.map((img) => ({ propertyId: property.id, ...img })),
        });
      if (tags?.length)
        await tx.propertyTag.createMany({
          data: tags.map((tag) => ({
            propertyId: property.id,
            tag: tag as any,
          })),
        });
      await saveDraftInventory(tx, property.id, source);
      await this.savePayout(tx, user.id, source);
      if (!owner.roles.includes('HOST'))
        await tx.user.update({
          where: { id: user.id },
          data: {
            roles: { set: [...owner.roles, 'HOST'] },
            hostStatus: owner.hostStatus || 'PENDING',
          },
        });
      const result = await tx.property.findUniqueOrThrow({
        where: { id: property.id },
        include: this.include,
      });
      return {
        ...result,
        ...(result.details as any),
        host: publicProperty(result, true).host,
        blockedDates: [],
        success: true,
      };
    });
  }
  private maskPublicLocation(property: any, exact = false) {
    return publicProperty(property, exact);
  }
  async findAll(adminView = false): Promise<any[]> {
    await this.cleanupExpiredSponsorships();
    const rows = await this.prisma.property.findMany({
      where: adminView ? {} : this.visible,
      include: this.include,
      take: 200,
      orderBy: [{ searchRankBoost: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((p) =>
      adminView
        ? { ...p, host: publicProperty(p, true).host }
        : publicProperty(p),
    );
  }
  async findOne(id: string, adminView = false, user?: any): Promise<any> {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: this.include,
    });
    if (!property) throw new NotFoundException('Property not found');
    const owner = user?.id === property.hostId || isOperationsAdmin(user);
    if (adminView && !owner)
      throw new ForbiddenException(
        'Private property view requires owner or administrator access',
      );
    if (
      !owner &&
      (property.status !== 'ACTIVE' ||
        property.hasActiveFault ||
        property.host.deletedAt ||
        property.host.hostStatus === 'SUSPENDED')
    )
      throw new NotFoundException('Published property not found');
    return owner
      ? {
          ...property,
          ...(property.details as any),
          host: publicProperty(property, true).host,
          blockedDates: publicProperty(property).blockedDates,
        }
      : publicProperty(property);
  }
  async lookupByCode(code: string) {
    const row = await this.prisma.property.findFirst({
      where: {
        ...this.visible,
        OR: [
          {
            propertyCode: {
              equals: text(code, 'Property code'),
              mode: 'insensitive',
            },
          },
          { id: code },
        ],
      },
      include: this.include,
    });
    return row ? publicProperty(row) : null;
  }
  async createIncident(propertyId: string, data: any, user?: any) {
    const p = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!p) throw new NotFoundException('Property not found');
    if (!user?.id) throw new ForbiddenException('Authentication is required');
    const participant =
      p.hostId === user.id ||
      isOperationsAdmin(user) ||
      (await this.prisma.booking.findFirst({
        where: {
          propertyId,
          guestId: user.id,
          status: { in: ['CONFIRMED', 'COMPLETED'] },
          payment: { status: { in: ['CAPTURED', 'RELEASED'] } },
        },
      }));
    if (!participant)
      throw new ForbiddenException(
        'Only a booked guest, host or admin can report an incident',
      );
    const title = text(data.title, 'Incident title', 200);
    const description = text(data.description, 'Incident description', 5000);
    if (
      data.severity &&
      !['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(data.severity)
    )
      throw new BadRequestException('Invalid severity');
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Property" WHERE id = ${propertyId} FOR UPDATE`;
      const incident = await tx.propertyIncident.create({
        data: {
          propertyId,
          reportedById: user.id,
          incidentCode: `ST-INC-${randomBytes(8).toString('hex')}`,
          title,
          description,
          category: data.category || 'MAINTENANCE',
          severity: data.severity || 'MEDIUM',
          status: 'OPEN',
        },
      });
      // A report enters moderation; only an administrator can impose a publication fault.
      return incident;
    });
  }
  async updateIncidentStatus(
    incidentId: string,
    status: string,
    notes?: string,
  ) {
    if (!['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status))
      throw new BadRequestException('Invalid incident status');
    return this.prisma.$transaction(async (tx) => {
      const incident = await tx.propertyIncident.findUniqueOrThrow({
        where: { id: incidentId },
      });
      await tx.$queryRaw`SELECT id FROM "Property" WHERE id = ${incident.propertyId} FOR UPDATE`;
      const result = await tx.propertyIncident.update({
        where: { id: incidentId },
        data: {
          status,
          resolutionNotes: notes?.slice(0, 5000),
          resolvedAt: ['RESOLVED', 'CLOSED'].includes(status)
            ? new Date()
            : null,
        },
      });
      const count = await tx.propertyIncident.count({
        where: {
          propertyId: incident.propertyId,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
      });
      await tx.property.update({
        where: { id: incident.propertyId },
        data: { hasActiveFault: count > 0, faultCount: count },
      });
      return result;
    });
  }
  async getExactLocation(id: string, userId?: string) {
    if (!userId) throw new ForbiddenException('Authentication is required');
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ id: userId }, { firebaseUid: userId }] },
    });
    if (!user) throw new ForbiddenException('User not found');
    const p = await this.prisma.property.findUniqueOrThrow({
      where: { id },
      include: this.include,
    });
    const paid = await this.prisma.booking.findFirst({
      where: {
        propertyId: id,
        guestId: user.id,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        payment: { status: { in: ['CAPTURED', 'RELEASED'] } },
      },
    });
    const exact =
      p.hostId === user.id || isOperationsAdmin(user) || Boolean(paid);
    const view = publicProperty(p, exact);
    return {
      isExactLocation: exact,
      address: view.address,
      city: p.city,
      state: p.state,
      country: p.country,
      lat: view.lat,
      lng: view.lng,
      host: view.host,
    };
  }
  async findByHostIdOrFirebaseUid(hostId: string, actor?: any): Promise<any[]> {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ id: hostId }, { firebaseUid: hostId }] },
    });
    if (!user) return [];
    const own =
      actor?.id === user.id ||
      actor?.firebaseUid === user.firebaseUid ||
      actor?.id === user.firebaseUid ||
      isOperationsAdmin(actor);
    const rows = await this.prisma.property.findMany({
      where: { ...(own ? {} : this.visible), hostId: user.id },
      include: this.include,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return rows.map((p) =>
      own
        ? {
            ...p,
            host: publicProperty(p, true).host,
            blockedDates: publicProperty(p).blockedDates,
          }
        : publicProperty(p),
    );
  }
  async cleanupExpiredSponsorships() {
    const rows = await this.prisma.property.findMany({
      where: {
        isSponsored: true,
        OR: [{ sponsoredUntil: { lte: new Date() } }, { sponsoredUntil: null }],
      },
      select: { id: true },
      take: 500,
    });
    for (const p of rows)
      await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Property" WHERE id=${p.id} FOR UPDATE`;
        const active = await tx.propertyBoost.findMany({
          where: {
            propertyId: p.id,
            status: 'ACTIVE',
            endDate: { gt: new Date() },
          },
        });
        const rank = (tier: string) =>
          ({ BOOST_BASIC: 25, SUPER_BOOST: 60, ULTRA_SPOTLIGHT: 120 })[tier] ||
          0;
        active.sort(
          (a, b) =>
            rank(b.tier) - rank(a.tier) ||
            b.endDate.getTime() - a.endDate.getTime(),
        );
        const top = active[0];
        await tx.property.update({
          where: { id: p.id },
          data: {
            isSponsored: !!top,
            sponsoredTier: top?.tier || null,
            sponsoredUntil: top?.endDate || null,
            searchRankBoost: top ? rank(top.tier) : 0,
          },
        });
      });
  }

  async search(
    city?: string,
    category?: PropertyCategory,
    checkIn?: string,
    checkOut?: string,
    guests?: number,
  ): Promise<any[]> {
    if (category && !Object.values(PropertyCategory).includes(category))
      throw new BadRequestException('Invalid category');
    if (guests !== undefined) integer(guests, 'Guests', 1, 1000);
    if (Boolean(checkIn) !== Boolean(checkOut))
      throw new BadRequestException('Supply both check-in and check-out');
    const where: any = {
      ...this.visible,
      ...(city
        ? { city: { contains: text(city, 'City', 100), mode: 'insensitive' } }
        : {}),
      ...(category ? { category } : {}),
      ...(guests ? { maxGuests: { gte: guests } } : {}),
    };
    if (checkIn && checkOut) {
      const a = dateOnly(checkIn, 'Check-in');
      const b = dateOnly(checkOut, 'Check-out');
      if (b <= a)
        throw new BadRequestException('Check-out must follow check-in');
      where.availabilityBlocks = {
        none: { startDate: { lt: b }, endDate: { gt: a } },
      };
      const hasWeekday = Array.from(
        {
          length: Math.min(
            366,
            Math.ceil((b.getTime() - a.getTime()) / 86400000),
          ),
        },
        (_, i) => new Date(a.getTime() + i * 86400000).getUTCDay(),
      ).some((day) => day !== 0 && day !== 6);
      if (hasWeekday) where.availabilityScheduleType = { not: 'WEEKENDS_ONLY' };
    }
    await this.cleanupExpiredSponsorships();
    return (
      await this.prisma.property.findMany({
        where,
        include: this.include,
        take: 200,
        orderBy: [{ searchRankBoost: 'desc' }, { createdAt: 'desc' }],
      })
    ).map((p) => publicProperty(p));
  }
  async findByType(type: PropertyType): Promise<any[]> {
    if (!Object.values(PropertyType).includes(type))
      throw new BadRequestException('Invalid property type');
    return (
      await this.prisma.property.findMany({
        where: { ...this.visible, type },
        include: this.include,
        take: 200,
      })
    ).map((p) => publicProperty(p));
  }
  async findByRadius(lat: number, lng: number, radiusKm = 10): Promise<any[]> {
    if (
      !Number.isFinite(lat) ||
      Math.abs(lat) > 90 ||
      !Number.isFinite(lng) ||
      Math.abs(lng) > 180 ||
      !Number.isFinite(radiusKm) ||
      radiusKm <= 0 ||
      radiusKm > 50
    )
      throw new BadRequestException('Invalid map coordinates or radius');
    const ids: { id: string }[] = await this.prisma
      .$queryRaw`SELECT p.id FROM "Property" p JOIN "User" h ON h.id = p."hostId" WHERE p.status='ACTIVE' AND p."hasActiveFault"=false AND h."deletedAt" IS NULL AND (h."hostStatus" IS NULL OR h."hostStatus"='APPROVED') AND p.lat IS NOT NULL AND p.lng IS NOT NULL AND 6371*acos(least(1.0,greatest(-1.0,cos(radians(${lat}))*cos(radians(p.lat))*cos(radians(p.lng)-radians(${lng}))+sin(radians(${lat}))*sin(radians(p.lat))))) <= ${radiusKm} LIMIT 100`;
    return (
      await this.prisma.property.findMany({
        where: { id: { in: ids.map((i) => i.id) } },
        include: this.include,
      })
    ).map((p) => publicProperty(p));
  }
  async update(id: string, payload: any, user?: any): Promise<any> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Property" WHERE id = ${id} FOR UPDATE`;
      const current = await this.owned(id, user, tx);
      const { data, images, tags, source } = propertyInput(payload, current);
      if (source.status !== undefined) {
        if (!['DRAFT', 'PAUSED'].includes(source.status))
          throw new ForbiddenException(
            'Submit a draft through the review endpoint; publication is managed by admins',
          );
        data.status = source.status;
      }
      if (
        ['address', 'city', 'state', 'lat', 'lng', 'type', 'maxGuests'].some(
          (k) => data[k] !== undefined && data[k] !== current[k],
        )
      ) {
        const active = await tx.booking.count({
          where: {
            propertyId: id,
            status: {
              in: ['CONFIRMED', 'PENDING_PAYMENT', 'PENDING_HOST_APPROVAL'],
            },
            checkOut: { gt: new Date() },
          },
        });
        if (active)
          throw new ConflictException(
            'Location or capacity cannot change while reservations are active',
          );
        if (current.status === 'ACTIVE') data.status = 'PENDING_REVIEW';
      }
      if (Object.keys(data).some((k) => k.endsWith('DocUrl'))) {
        data.propertyDocsVerified = false;
        data.propertyDocsVerifiedAt = null;
        if (current.status === 'ACTIVE') data.status = 'PENDING_REVIEW';
      }
      await tx.property.update({ where: { id }, data });
      if (images !== undefined) {
        await tx.propertyImage.deleteMany({ where: { propertyId: id } });
        if (images.length)
          await tx.propertyImage.createMany({
            data: images.map((img) => ({ propertyId: id, ...img })),
          });
      }
      if (tags !== undefined) {
        await tx.propertyTag.deleteMany({
          where: { propertyId: id, autoApplied: false },
        });
        if (tags.length)
          await tx.propertyTag.createMany({
            data: tags.map((tag) => ({ propertyId: id, tag: tag as any })),
            skipDuplicates: true,
          });
      }
      await saveDraftInventory(tx, id, source);
      await this.savePayout(tx, current.hostId, source);
      const result = await tx.property.findUniqueOrThrow({
        where: { id },
        include: this.include,
      });
      return {
        ...result,
        ...(result.details as any),
        host: publicProperty(result, true).host,
        blockedDates: publicProperty(result).blockedDates,
      };
    });
  }
  async remove(id: string, user?: any): Promise<any> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Property" WHERE id=${id} FOR UPDATE`;
      await this.owned(id, user, tx);
      const active = await tx.booking.count({
        where: {
          propertyId: id,
          status: {
            in: ['CONFIRMED', 'PENDING_PAYMENT', 'PENDING_HOST_APPROVAL'],
          },
          checkOut: { gt: new Date() },
        },
      });
      if (active)
        throw new ConflictException('Property has active reservations');
      // Archiving preserves bookings, conversations, leases and financial history.
      return tx.property.update({ where: { id }, data: { status: 'PAUSED' } });
    });
  }
  async checkAvailability(id: string, startDate: Date, endDate: Date) {
    return !(await this.prisma.availabilityBlock.findFirst({
      where: {
        propertyId: id,
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
    }));
  }
  async setAvailability(id: string, payload: any, user: any, replace = true) {
    if (
      !Array.isArray(payload.blockedDates) ||
      payload.blockedDates.length > 730
    )
      throw new BadRequestException('blockedDates must be an array');
    const blocks = payload.blockedDates.map((v) => {
      const a = dateOnly(
        typeof v === 'string' ? v : v.startDate,
        'Blocked start',
      );
      const b =
        typeof v === 'string'
          ? new Date(a.getTime() + 86400000)
          : dateOnly(v.endDate, 'Blocked end');
      if (b <= a)
        throw new BadRequestException('Blocked interval end must follow start');
      return {
        propertyId: id,
        startDate: a,
        endDate: b,
        type: 'HOST_BLOCKED' as const,
        source: 'MANUAL',
      };
    });
    const settings = propertyInput(
      {
        ...(payload.availabilityScheduleType !== undefined
          ? { availabilityScheduleType: payload.availabilityScheduleType }
          : {}),
        ...(payload.weekendSurchargePercent !== undefined
          ? { weekendSurchargePercent: payload.weekendSurchargePercent }
          : {}),
      },
      {},
    ).data;
    delete settings.details;
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Property" WHERE id=${id} FOR UPDATE`;
      await this.owned(id, user, tx);
      for (const block of blocks) {
        if (
          await tx.booking.findFirst({
            where: {
              propertyId: id,
              status: {
                in: ['PENDING_PAYMENT', 'PENDING_HOST_APPROVAL', 'CONFIRMED'],
              },
              checkIn: { lt: block.endDate },
              checkOut: { gt: block.startDate },
            },
          })
        )
          throw new ConflictException(
            'A blocked date overlaps an active reservation',
          );
      }
      if (replace)
        await tx.availabilityBlock.deleteMany({
          where: {
            propertyId: id,
            type: 'HOST_BLOCKED',
            OR: [{ source: null }, { source: 'MANUAL' }],
          },
        });
      if (blocks.length)
        await tx.availabilityBlock.createMany({ data: blocks });
      const property = await tx.property.update({
        where: { id },
        data: settings,
        include: this.include,
      });
      return {
        success: true,
        propertyId: id,
        blockedDates: publicProperty(property).blockedDates,
        availabilityScheduleType: property.availabilityScheduleType,
        weekendSurchargePercent: property.weekendSurchargePercent,
      };
    });
  }
  async addAvailabilityBlocks(id: string, blockedDates: any[], user?: any) {
    return this.setAvailability(id, { blockedDates }, user, false);
  }
}
