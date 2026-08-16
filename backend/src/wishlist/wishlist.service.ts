import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async add(userId: string, propertyId: string) {
    const existing = await this.prisma.wishlist.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        }
      }
    });

    if (existing) {
      throw new ConflictException('Property already in wishlist');
    }

    return this.prisma.wishlist.create({
      data: {
        userId,
        propertyId,
      },
    });
  }

  async remove(userId: string, propertyId: string) {
    try {
      return await this.prisma.wishlist.delete({
        where: {
          userId_propertyId: {
            userId,
            propertyId,
          }
        }
      });
    } catch (e) {
      throw new NotFoundException('Wishlist item not found');
    }
  }

  async findAll(userId: string) {
    return this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        property: {
          include: { images: { take: 1, orderBy: { order: 'asc' } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
