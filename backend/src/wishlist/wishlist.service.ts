import { publicProperty } from '../properties/property-view.util';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async add(userId: string, propertyId: string) {
    const p = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { status: true },
    });
    if (!p || p.status !== 'ACTIVE')
      throw new NotFoundException('Published property not found');
    return this.prisma.wishlist.upsert({
      where: { userId_propertyId: { userId, propertyId } },
      create: { userId, propertyId },
      update: {},
    });
  }

  async remove(userId: string, propertyId: string) {
    await this.prisma.wishlist.deleteMany({ where: { userId, propertyId } });
    return { success: true };
  }

  async findAll(userId: string) {
    const rows = await this.prisma.wishlist.findMany({
      where: {
        userId,
        property: {
          status: 'ACTIVE',
          host: { deletedAt: null, hostStatus: { not: 'SUSPENDED' } },
        },
      },
      include: { property: { include: { images: true, host: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return rows.map((r) => ({ ...r, property: publicProperty(r.property) }));
  }
}
