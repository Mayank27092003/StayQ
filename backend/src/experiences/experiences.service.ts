import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { text, integer, money } from '../common/utils/input.util';
const operator = (u: any) =>
  u?.isAdmin &&
  ['SUPER_ADMIN', 'OPERATIONS', 'TRUST_SAFETY'].includes(u.adminRole);
const ifProvided = (cond: any, val: string) => (cond ? val : null);
@Injectable()
export class ExperiencesService {
  constructor(private prisma: PrismaService) {}
  private input(d: any, partial = false) {
    const out: any = {};
    for (const [k, max] of Object.entries({
      title: 200,
      description: 10000,
      location: 500,
      meetingPoint: 500,
      city: 100,
      scheduleTime: 100,
    }))
      if (d[k] !== undefined) out[k] = text(d[k], k, max);
    if (!partial)
      for (const k of ['title', 'description', 'location'])
        if (!out[k]) throw new BadRequestException(k + ' is required');
    if (!out.city && out.location) {
      out.city = out.location.split(',')[0].trim();
    }
    if (d.transportOption !== undefined) {
      out.transportOption =
        d.transportOption === 'PICKUP_DROP' ? 'PICKUP_DROP' : 'SELF_ARRIVE';
    }
    if (d.foodIncluded !== undefined) {
      out.foodIncluded = Boolean(d.foodIncluded);
    }
    if (d.equipmentIncluded !== undefined) {
      out.equipmentIncluded = Boolean(d.equipmentIncluded);
    }
    if (d.kidsFreeAgeLimit !== undefined) {
      out.kidsFreeAgeLimit = integer(d.kidsFreeAgeLimit, 'Kids Free Age', 0, 18);
    }
    if (d.category !== undefined) {
      out.category = text(d.category, 'Category', 100);
    } else if (!partial) throw new BadRequestException('Category is required');
    if (d.durationMinutes !== undefined)
      out.durationMinutes = integer(d.durationMinutes, 'Duration', 1, 10080);
    if (d.maxGroupSize !== undefined)
      out.maxGroupSize = integer(d.maxGroupSize, 'Capacity', 1, 1000);
    if (d.pricePerPerson !== undefined || d.price !== undefined)
      out.pricePerPerson = money(d.pricePerPerson ?? d.price, 'Price');
    if (!partial)
      for (const k of ['durationMinutes', 'maxGroupSize', 'pricePerPerson'])
        if (out[k] === undefined)
          throw new BadRequestException(k + ' is required');
    for (const k of ['includes', 'whatToBring'])
      if (d[k] !== undefined) {
        if (!Array.isArray(d[k]) || d[k].length > 50)
          throw new BadRequestException('Invalid ' + k);
        out[k] = d[k].map((x) => text(x, k, 200));
      }
    for (const k of ['lat', 'lng'])
      if (d[k] !== undefined) {
        const v = d[k];
        if (
          typeof v !== 'number' ||
          !Number.isFinite(v) ||
          Math.abs(v) > (k === 'lat' ? 90 : 180)
        )
          throw new BadRequestException('Invalid coordinate');
        out[k] = v;
      }
    if (d.imageUrls !== undefined) {
      if (
        !Array.isArray(d.imageUrls) ||
        d.imageUrls.length > 30 ||
        d.imageUrls.some(
          (u) =>
            typeof u !== 'string' || u.length > 2048 || !/^https?:\/\//.test(u),
        )
      )
        throw new BadRequestException('Invalid images');
    }
    return out;
  }
  private view(p: any) {
    const images = (p.images || []).map((img: any) =>
      typeof img === 'string' ? img : img.url || '',
    );
    const totalSpots =
      (p.slots || []).reduce(
        (acc: number, s: any) => acc + (s.spotsTotal || 0),
        0,
      ) ||
      p.maxGroupSize ||
      10;
    const takenSpots = (p.slots || []).reduce(
      (acc: number, s: any) => acc + (s.spotsTaken || 0),
      0,
    );
    const availableSpots = Math.max(0, totalSpots - takenSpots);

    return {
      ...p,
      price: Number(p.pricePerPerson),
      pricePerPerson: Number(p.pricePerPerson),
      pricePerNight: Number(p.pricePerPerson),
      meetingPoint: undefined,
      lat: typeof p.lat === 'number' ? Math.round(p.lat * 50) / 50 : null,
      lng: typeof p.lng === 'number' ? Math.round(p.lng * 50) / 50 : null,
      images,
      imageUrls: images,
      duration: p.durationMinutes
        ? `${Math.floor(p.durationMinutes / 60)} hours`
        : '3 hours',
      timeSlot: p.scheduleTime || '12:00 PM - 03:00 PM',
      scheduleTime: p.scheduleTime || '12:00 PM - 03:00 PM',
      maxSpots: totalSpots,
      availableSpots,
      remainingSlots: availableSpots,
      isExperience: true,
      category: 'EXPERIENCES',
      experienceCategory: p.category,
      transportOption: p.transportOption || 'SELF_ARRIVE',
      pickupProvided: p.transportOption === 'PICKUP_DROP',
      foodIncluded: Boolean(p.foodIncluded),
      equipmentIncluded: Boolean(p.equipmentIncluded),
      kidsFreeAgeLimit: Number(p.kidsFreeAgeLimit) || 0,
      hostName: p.host?.displayName || 'StayQ Host',
      hostAvatar: p.host?.photoUrl || '',
      hostAvatarUrl: p.host?.photoUrl || '',
      rating: 4.95,
      reviewCount: 18,
      isGuestFavorite: true,
      isStarHost: true,
      amenities: [
        p.transportOption === 'PICKUP_DROP'
          ? 'Pickup & Drop Included'
          : 'Self-Arrival',
        ifProvided(p.foodIncluded, 'Food & Drinks Provided'),
        ifProvided(p.equipmentIncluded, 'Equipment & Materials Provided'),
        p.kidsFreeAgeLimit > 0
          ? `Kids up to ${p.kidsFreeAgeLimit} yrs Free`
          : 'All Ages Welcome',
        ...(p.includes || []),
      ].filter(Boolean),
      host: {
        id: p.host?.firebaseUid || p.hostId,
        displayName: p.host?.displayName || 'StayQ Host',
        photoUrl: p.host?.photoUrl || '',
      },
    };
  }
  async create(data: any) {
    let host = await this.prisma.user.findUnique({
      where: { id: data.hostId },
    });
    if (!host) {
      throw new ForbiddenException('Active host account required');
    }
    if (host.deletedAt || host.hostStatus === 'SUSPENDED') {
      throw new ForbiddenException('Active host account required');
    }
    if (!host.roles.includes('HOST')) {
      host = await this.prisma.user.update({
        where: { id: host.id },
        data: {
          roles: { push: 'HOST' },
          hostStatus: host.hostStatus || 'APPROVED',
        },
      });
    }

    const input = this.input(data);
    const exp = await this.prisma.experience.create({
      data: {
        ...input,
        hostId: host.id,
        status: 'ACTIVE',
        images: {
          create: (data.imageUrls || []).map((url: string, order: number) => ({
            url,
            order,
          })),
        },
      },
      include: { images: true, slots: true },
    });

    const now = new Date();
    const startTime =
      input.scheduleTime?.split('-')?.[0]?.trim() || '10:00 AM';
    for (let day = 0; day < 30; day++) {
      const slotDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + day,
      );
      await this.prisma.experienceSlot.create({
        data: {
          experienceId: exp.id,
          date: slotDate,
          startTime,
          spotsTotal: input.maxGroupSize || 8,
          spotsTaken: 0,
        },
      });
    }

    return this.findOne(exp.id, host);
  }
  async findAll(
    adminView = false,
    user?: any,
    query?: { city?: string; category?: string },
  ) {
    if (adminView && !operator(user))
      throw new ForbiddenException('Operations administrator required');

    const where: any = adminView
      ? {}
      : {
          status: 'ACTIVE',
          host: { deletedAt: null, hostStatus: { not: 'SUSPENDED' } },
        };

    if (query?.city && query.city.trim().length > 0) {
      const cityTerm = query.city.trim();
      where.OR = [
        { city: { contains: cityTerm, mode: 'insensitive' } },
        { location: { contains: cityTerm, mode: 'insensitive' } },
      ];
    }

    if (query?.category && query.category.trim().length > 0) {
      where.category = query.category.trim();
    }

    const rows = await this.prisma.experience.findMany({
      where,
      include: {
        images: { orderBy: { order: 'asc' } },
        slots: { where: { date: { gte: new Date() } } },
        host: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return adminView ? rows : rows.map((p) => this.view(p));
  }
  async findOne(id: string, user?: any) {
    const p = await this.prisma.experience.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        slots: { where: { date: { gte: new Date() } } },
        host: true,
      },
    });
    if (!p) throw new NotFoundException('Experience not found');
    const owner = p.hostId === user?.id || operator(user);
    if (
      !owner &&
      (p.status !== 'ACTIVE' ||
        p.host.deletedAt ||
        p.host.hostStatus === 'SUSPENDED')
    )
      throw new NotFoundException('Published experience not found');
    return owner ? p : this.view(p);
  }
  async update(id: string, dto: any, user?: any) {
    if (!user?.id) throw new ForbiddenException('Authenticated owner required');
    const data = this.input(dto, true);
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Experience" WHERE id=${id} FOR UPDATE`;
      const p = await tx.experience.findUnique({ where: { id } });
      if (!p) throw new NotFoundException('Experience not found');
      if (p.hostId !== user.id && !operator(user))
        throw new ForbiddenException('Experience owner required');
      if (dto.status !== undefined) {
        if (!['PAUSED', 'PENDING_REVIEW'].includes(dto.status))
          throw new ForbiddenException(
            'Publication requires administrator review',
          );
        data.status = dto.status;
      } else if (p.status === 'ACTIVE') data.status = 'PENDING_REVIEW';
      if (dto.imageUrls) {
        await tx.experienceImage.deleteMany({ where: { experienceId: id } });
        data.images = {
          create: dto.imageUrls.map((url, order) => ({ url, order })),
        };
      }
      return tx.experience.update({
        where: { id },
        data,
        include: { images: true },
      });
    });
  }
  async remove(id: string, user?: any) {
    return this.update(id, { status: 'PAUSED' }, user);
  }
  async findSlots(id: string, user?: any) {
    await this.findOne(id, user);
    return this.prisma.experienceSlot.findMany({
      where: { experienceId: id, date: { gte: new Date() } },
      orderBy: { date: 'asc' },
      take: 200,
    });
  }
}
