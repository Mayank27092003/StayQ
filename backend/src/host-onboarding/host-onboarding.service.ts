import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HostOnboardingService {
  constructor(private prisma: PrismaService) {}

  async createDraft(hostId: string, data: any) {
    const property = await this.prisma.property.create({
      data: {
        hostId,
        title: data.title || 'Draft Property',
        description: data.description || '',
        type: data.type || 'HOTEL',
        category: data.category || 'VILLA',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pricePerNight: data.pricePerNight || 0,
        status: 'DRAFT',
        // RV-specific
        pickupLocation: data.pickupLocation || null,
        dropLocation: data.dropLocation || null,
        vehicleType: data.vehicleType || null,
        rvFacilities: data.rvFacilities || [],
        // Camping-specific
        terrainType: data.terrainType || null,
        tentCapacity: data.tentCapacity || null,
        hasCampfire: data.hasCampfire || false,
        // Hostel/Dorm-specific
        bedCount: data.bedCount || null,
        dormType: data.dormType || null,
        hasLocker: data.hasLocker || false,
        // Long-term
        longTermAvailable: data.longTermAvailable || false,
        monthlyRent: data.monthlyRent || null,
        securityDeposit: data.securityDeposit || null,
      },
    });

    if (data.accountNumber || data.upiId) {
      await this.prisma.hostPayoutAccount.upsert({
        where: { userId: hostId },
        update: {
          accountHolderName: data.accountHolderName || '',
          accountNumber: data.accountNumber || '',
          ifscCode: data.ifscCode || '',
          bankName: data.bankName || '',
          upiId: data.upiId || null,
          passbookImageUrl: data.bankPassbookImagePath || null,
        },
        create: {
          userId: hostId,
          accountHolderName: data.accountHolderName || '',
          accountNumber: data.accountNumber || '',
          ifscCode: data.ifscCode || '',
          bankName: data.bankName || '',
          upiId: data.upiId || null,
          passbookImageUrl: data.bankPassbookImagePath || null,
        },
      });
    }

    return property;
  }

  async updateStep(propertyId: string, hostId: string, data: any) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.hostId !== hostId) throw new UnauthorizedException('Not the owner');

    const { tags, images, ...propertyData } = data;

    const updatedProperty = await this.prisma.property.update({
      where: { id: propertyId },
      data: propertyData,
    });

    if (tags && Array.isArray(tags)) {
      await this.prisma.propertyTag.deleteMany({ where: { propertyId } });
      if (tags.length > 0) {
        await this.prisma.propertyTag.createMany({
          data: tags.map((tag: any) => ({
            propertyId,
            tag,
            autoApplied: false,
          })),
        });
      }
    }

    if (images && Array.isArray(images)) {
      // Assuming images is an array of URL strings or objects with a url property
      await this.prisma.propertyImage.deleteMany({ where: { propertyId } });
      if (images.length > 0) {
        await this.prisma.propertyImage.createMany({
          data: images.map((img: any, index: number) => ({
            propertyId,
            url: typeof img === 'string' ? img : img.url,
            order: typeof img === 'object' && img.order !== undefined ? img.order : index,
          })),
        });
      }
    }

    return updatedProperty;
  }

  async setRooms(propertyId: string, hostId: string, rooms: any[]) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.hostId !== hostId) throw new UnauthorizedException('Not the owner');

    // First delete existing rooms for this property (replacement strategy)
    await this.prisma.roomType.deleteMany({ where: { propertyId } });

    if (rooms && rooms.length > 0) {
      await this.prisma.roomType.createMany({
        data: rooms.map(room => ({
          propertyId,
          name: room.name,
          totalRooms: room.totalRooms,
          guestCapacity: room.guestCapacity,
          roomSizeSqft: room.roomSizeSqft,
          bedType: room.bedType,
          basePrice: room.basePrice,
          weekendPrice: room.weekendPrice || room.basePrice,
          amenities: room.amenities || [],
        })),
      });
    }
    
    return this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { roomTypes: true },
    });
  }

  async submitProperty(propertyId: string, hostId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { roomTypes: true },
    });

    if (!property) throw new NotFoundException('Property not found');
    if (property.hostId !== hostId) throw new UnauthorizedException('Not the owner');
    
    // Basic validation
    if (!property.title || !property.address) {
      throw new BadRequestException('Property is missing critical information');
    }

    // If the user is already an approved HOST, future properties are instantly activated
    const user = await this.prisma.user.findUnique({ where: { id: hostId } });
    const isApprovedHost = user?.roles.includes('HOST');

    return this.prisma.property.update({
      where: { id: propertyId },
      data: { status: isApprovedHost ? 'ACTIVE' : 'PENDING_REVIEW' },
    });
  }
}
