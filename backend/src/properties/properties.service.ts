import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Property, Prisma, PropertyCategory, PropertyType, AvailabilityBlockType } from '@prisma/client';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<Property> {
    // 1. Ensure a valid hostId exists
    let hostId = data.hostId;
    if (!hostId) {
      const defaultHost = await this.prisma.user.findFirst();
      if (defaultHost) {
        hostId = defaultHost.id;
      } else {
        const newHost = await this.prisma.user.create({
          data: {
            firebaseUid: `admin-host-${Date.now()}`,
            email: data.host?.email || 'admin@stayq.space',
            displayName: data.host?.firstName ? `${data.host.firstName} ${data.host.lastName || ''}`.trim() : 'Stay Q Host',
            phone: data.host?.phone || '+919999999999',
            roles: ['HOST', 'GUEST'],
            isAdmin: true,
          },
        });
        hostId = newHost.id;
      }
    }

    // 2. Normalize category and type
    let category: PropertyCategory = PropertyCategory.VILLA;
    const catStr = (typeof data.category === 'object' ? data.category?.name : data.category || '').toUpperCase().replace(/S$/, '');
    if (Object.values(PropertyCategory).includes(catStr as PropertyCategory)) {
      category = catStr as PropertyCategory;
    } else if (catStr.includes('BEACH')) {
      category = PropertyCategory.BEACHFRONT;
    } else if (catStr.includes('CABIN')) {
      category = PropertyCategory.CABIN;
    } else if (catStr.includes('MANSION')) {
      category = PropertyCategory.MANSION;
    } else if (catStr.includes('CAMP')) {
      category = PropertyCategory.CAMPING;
    } else if (catStr.includes('TREE')) {
      category = PropertyCategory.TREEHOUSE;
    }

    let type: PropertyType = PropertyType.VILLA;
    const typeStr = (data.type || '').toUpperCase();
    if (Object.values(PropertyType).includes(typeStr as PropertyType)) {
      type = typeStr as PropertyType;
    } else if (typeStr.includes('RV')) {
      type = PropertyType.RV;
    } else if (typeStr.includes('CAMP')) {
      type = PropertyType.CAMPING_SITE;
    } else if (typeStr.includes('HOTEL')) {
      type = PropertyType.HOTEL;
    } else if (typeStr.includes('HOSTEL')) {
      type = PropertyType.HOSTEL;
    } else if (typeStr.includes('LONG') || typeStr.includes('ZERO_BROKER')) {
      type = PropertyType.LONG_TERM_HOME;
    }

    const price = Number(data.pricePerNight ?? data.basePrice ?? 5000);
    const cleaning = Number(data.cleaningFee ?? 0);

    const property = await this.prisma.property.create({
      data: {
        hostId,
        title: data.title || 'Untitled Property',
        description: data.description || '',
        category,
        type,
        address: data.address || '',
        city: data.city || 'Goa',
        state: data.state || 'Goa',
        country: data.country || 'India',
        pincode: data.pincode ? String(data.pincode) : null,
        lat: data.lat ? Number(data.lat) : null,
        lng: data.lng ? Number(data.lng) : null,
        pricePerNight: price,
        cleaningFee: cleaning,
        maxGuests: Number(data.maxGuests ?? 4),
        bedrooms: Number(data.bedrooms ?? 2),
        beds: Number(data.beds ?? 2),
        bathrooms: Number(data.bathrooms ?? 2),
        amenities: Array.isArray(data.amenities) ? data.amenities : [],
        instantBook: data.instantBook ?? true,
        petsAllowed: data.petsAllowed ?? false,
        smokingAllowed: data.smokingAllowed ?? false,
        partiesAllowed: data.partiesAllowed ?? false,
        checkInTime: data.checkInTime || '14:00',
        checkOutTime: data.checkOutTime || '11:00',
        longTermAvailable: Boolean(data.isZeroBroker || data.longTermAvailable),
        monthlyRent: data.monthlyRent ? Number(data.monthlyRent) : null,
        securityDeposit: data.securityDeposit ? Number(data.securityDeposit) : null,
        leaseDurationMonths: data.leaseDurationMonths ? Number(data.leaseDurationMonths) : 11,
        status: data.status || 'ACTIVE',
      },
      include: {
        images: true,
        host: true,
        tags: true,
      },
    });

    // Create property images if provided
    if (Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
      for (let i = 0; i < data.imageUrls.length; i++) {
        const url = data.imageUrls[i];
        if (typeof url === 'string' && url.trim()) {
          await this.prisma.propertyImage.create({
            data: {
              propertyId: property.id,
              url: url.trim(),
              order: i,
            },
          }).catch(() => {});
        }
      }
    }

    return property;
  }

  private maskPublicLocation(property: any, allowExact: boolean = false) {
    if (!property) return null;
    if (allowExact) {
      return {
        ...property,
        isExactLocation: true,
      };
    }

    const approximateLocation = `${property.city || ''}, ${property.state || ''}, ${property.country || 'India'}`.replace(/^,\s*|,\s*$/g, '');
    const latJitter = property.lat ? Number((Number(property.lat) + 0.003).toFixed(5)) : null;
    const lngJitter = property.lng ? Number((Number(property.lng) - 0.003).toFixed(5)) : null;

    return {
      ...property,
      address: approximateLocation,
      approximateLocation,
      exactAddressMasked: true,
      isExactLocation: false,
      approximateRadiusMeters: 600,
      approximateLat: latJitter || property.lat,
      approximateLng: lngJitter || property.lng,
      host: property.host ? {
        id: property.host.id,
        displayName: property.host.displayName,
        photoUrl: property.host.photoUrl,
        bio: property.host.bio,
        isStarHost: property.host.isSuperhost,
        isSuperhost: property.host.isSuperhost,
        createdAt: property.host.createdAt,
      } : undefined,
    };
  }

  async findAll(adminView: boolean = false): Promise<Property[]> {
    const list = await this.prisma.property.findMany({
      where: adminView ? undefined : { status: 'ACTIVE' },
      include: {
        images: true,
        host: true,
        tags: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (adminView) return list;
    return list.map((p) => this.maskPublicLocation(p, false)) as Property[];
  }

  async findOne(id: string, adminView: boolean = false): Promise<Property | null> {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        images: true,
        host: true,
        tags: true,
      },
    });

    if (!property) return null;
    if (adminView) return property;
    return this.maskPublicLocation(property, false) as Property;
  }

  async getExactLocation(id: string, userId?: string): Promise<any> {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: { host: true },
    });
    if (!property) return null;

    if (!userId) {
      return {
        isExactLocation: false,
        message: 'Exact location provided after booking is confirmed',
        approximateLocation: `${property.city}, ${property.state}, ${property.country}`,
        approximateRadiusMeters: 600,
      };
    }

    const user = await this.prisma.user.findFirst({
      where: { OR: [{ id: userId }, { firebaseUid: userId }] }
    });

    const isHostOrAdmin = user?.isAdmin || property.hostId === user?.id;
    if (isHostOrAdmin) {
      return {
        isExactLocation: true,
        address: property.address,
        city: property.city,
        state: property.state,
        country: property.country,
        pincode: property.pincode,
        lat: property.lat,
        lng: property.lng,
        host: property.host,
      };
    }

    const booking = await this.prisma.booking.findFirst({
      where: {
        propertyId: id,
        guestId: user?.id,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
    });

    if (!booking) {
      return {
        isExactLocation: false,
        message: 'Exact address will be unlocked once booking is confirmed',
        approximateLocation: `${property.city}, ${property.state}, ${property.country}`,
      };
    }

    return {
      isExactLocation: true,
      address: property.address,
      city: property.city,
      state: property.state,
      country: property.country,
      pincode: property.pincode,
      lat: property.lat,
      lng: property.lng,
      confirmationCode: booking.confirmationCode,
      host: property.host,
    };
  }

  async findByHostIdOrFirebaseUid(hostIdOrFirebaseUid: string): Promise<Property[]> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ id: hostIdOrFirebaseUid }, { firebaseUid: hostIdOrFirebaseUid }],
      },
    });
    if (!user) return [];
    
    return this.prisma.property.findMany({
      where: { hostId: user.id },
      include: {
        images: true,
        host: true,
        tags: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async search(city?: string, category?: PropertyCategory): Promise<Property[]> {
    return this.prisma.property.findMany({
      where: {
        status: 'ACTIVE',
        ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
        ...(category ? { category } : {}),
      },
      include: {
        images: true,
        host: true,
        tags: true,
      },
    });
  }

  async findByType(type: PropertyType): Promise<Property[]> {
    return this.prisma.property.findMany({
      where: {
        type,
        status: 'ACTIVE',
      },
      include: {
        images: true,
        host: true,
        tags: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByRadius(lat: number, lng: number, radiusKm: number): Promise<Property[]> {
    return this.prisma.$queryRaw`
      SELECT * FROM "Property"
      WHERE status = 'ACTIVE' AND (6371 * acos(cos(radians(${lat})) * cos(radians("lat")) * cos(radians("lng") - radians(${lng})) + sin(radians(${lat})) * sin(radians("lat")))) < ${radiusKm}
    `;
  }

  async update(id: string, updateDto: any): Promise<Property> {
    const data: any = {};
    if (updateDto.title !== undefined) data.title = updateDto.title;
    if (updateDto.description !== undefined) data.description = updateDto.description;
    if (updateDto.address !== undefined) data.address = updateDto.address;
    if (updateDto.city !== undefined) data.city = updateDto.city;
    if (updateDto.state !== undefined) data.state = updateDto.state;
    if (updateDto.country !== undefined) data.country = updateDto.country;
    if (updateDto.pincode !== undefined) data.pincode = updateDto.pincode;
    if (updateDto.lat !== undefined) data.lat = Number(updateDto.lat) || null;
    if (updateDto.lng !== undefined) data.lng = Number(updateDto.lng) || null;
    if (updateDto.pricePerNight !== undefined) data.pricePerNight = Number(updateDto.pricePerNight);
    if (updateDto.basePrice !== undefined) data.pricePerNight = Number(updateDto.basePrice);
    if (updateDto.cleaningFee !== undefined) data.cleaningFee = Number(updateDto.cleaningFee);
    if (updateDto.maxGuests !== undefined) data.maxGuests = Number(updateDto.maxGuests);
    if (updateDto.bedrooms !== undefined) data.bedrooms = Number(updateDto.bedrooms);
    if (updateDto.beds !== undefined) data.beds = Number(updateDto.beds);
    if (updateDto.bathrooms !== undefined) data.bathrooms = Number(updateDto.bathrooms);
    if (updateDto.amenities !== undefined && Array.isArray(updateDto.amenities)) data.amenities = updateDto.amenities;
    if (updateDto.instantBook !== undefined) data.instantBook = Boolean(updateDto.instantBook);
    if (updateDto.petsAllowed !== undefined) data.petsAllowed = Boolean(updateDto.petsAllowed);
    if (updateDto.smokingAllowed !== undefined) data.smokingAllowed = Boolean(updateDto.smokingAllowed);
    if (updateDto.partiesAllowed !== undefined) data.partiesAllowed = Boolean(updateDto.partiesAllowed);
    if (updateDto.checkInTime !== undefined) data.checkInTime = updateDto.checkInTime;
    if (updateDto.checkOutTime !== undefined) data.checkOutTime = updateDto.checkOutTime;
    if (updateDto.monthlyRent !== undefined) data.monthlyRent = Number(updateDto.monthlyRent);
    if (updateDto.securityDeposit !== undefined) data.securityDeposit = Number(updateDto.securityDeposit);
    if (updateDto.leaseDurationMonths !== undefined) data.leaseDurationMonths = Number(updateDto.leaseDurationMonths);
    if (updateDto.status !== undefined) data.status = updateDto.status;

    return this.prisma.property.update({
      where: { id },
      data,
      include: {
        images: true,
        host: true,
        tags: true,
      },
    });
  }

  async remove(id: string): Promise<Property> {
    return this.prisma.property.delete({ where: { id } });
  }

  async checkAvailability(id: string, startDate: Date, endDate: Date): Promise<boolean> {
    const blocks = await this.prisma.availabilityBlock.findMany({
      where: {
        propertyId: id,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
    return blocks.length === 0;
  }

  async addAvailabilityBlocks(id: string, blockedDates: { startDate: string; endDate: string }[]) {
    const blocks = blockedDates.map(date => ({
      propertyId: id,
      startDate: new Date(date.startDate),
      endDate: new Date(date.endDate),
      type: AvailabilityBlockType.HOST_BLOCKED,
    }));
    return this.prisma.availabilityBlock.createMany({
      data: blocks,
    });
  }
}
