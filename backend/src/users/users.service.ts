import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { HostStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
  }

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        photoUrl: true,
        bio: true,
        roles: true,
        isSuperhost: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async submitKyc(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Only allow updating if they are currently unreviewed or rejected
    if (user.hostStatus === HostStatus.PENDING || user.hostStatus === HostStatus.APPROVED) {
      return user; // Already pending or approved
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        hostStatus: HostStatus.PENDING,
        hostStatusUpdatedAt: new Date(),
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      include: {
        properties: { select: { id: true, title: true } },
        bookingsAsGuest: { select: { id: true, totalAmount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        properties: true,
        payoutAccount: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // 1. Unlink support tickets & clean up dependent records
    await this.prisma.supportTicket.updateMany({
      where: { userId },
      data: { userId: null },
    }).catch(() => {});

    await this.prisma.deviceToken.deleteMany({
      where: { userId },
    }).catch(() => {});

    await this.prisma.notification.deleteMany({
      where: { userId },
    }).catch(() => {});

    await this.prisma.wishlist.deleteMany({
      where: { userId },
    }).catch(() => {});

    await this.prisma.savedSearch.deleteMany({
      where: { userId },
    }).catch(() => {});

    try {
      return await this.prisma.user.delete({
        where: { id: userId },
      });
    } catch (err) {
      // If user has historical bookings/transactions, anonymize PII for legal GDPR/Apple compliance
      const anonymizedId = `deleted_${Date.now()}`;
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: `${anonymizedId}@deleted.stayq.space`,
          displayName: 'Deleted Account',
          phone: null,
          photoUrl: null,
          bio: null,
          location: null,
          roles: [],
        },
      });
    }
  }
}
