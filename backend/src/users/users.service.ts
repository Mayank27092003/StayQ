import { profileView, updateUserProfile } from './profile.util';
import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { HostStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return profileView(user);
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    return updateUserProfile(this.prisma, userId, dto);
  }

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ id: userId }, { firebaseUid: userId }], deletedAt: null },
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

    if (user.hostStatus === 'SUSPENDED' || user.deletedAt)
      throw new ForbiddenException(
        'Suspended or deleted account cannot request approval',
      );
    // Only allow updating if they are currently unreviewed or rejected
    if (
      user.hostStatus === HostStatus.PENDING ||
      user.hostStatus === HostStatus.APPROVED
    ) {
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
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('admin-privileges',0))`;
      await tx.$queryRaw`SELECT id FROM "Property" WHERE "hostId"=${userId} ORDER BY id FOR UPDATE`;
      const current = await tx.user.findUnique({ where: { id: userId } });
      if (
        current?.isAdmin &&
        current.adminRole === 'SUPER_ADMIN' &&
        (await tx.user.count({
          where: {
            id: { not: userId },
            isAdmin: true,
            adminRole: 'SUPER_ADMIN',
            deletedAt: null,
          },
        })) === 0
      )
        throw new ConflictException(
          'Promote another super admin before deleting this account',
        );
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
      if (
        await tx.booking.count({
          where: {
            status: {
              in: ['PENDING_PAYMENT', 'PENDING_HOST_APPROVAL', 'CONFIRMED'],
            },
            checkOut: { gt: new Date() },
            OR: [{ guestId: userId }, { property: { hostId: userId } }],
          },
        })
      )
        throw new ConflictException(
          'Resolve upcoming reservations before deleting this account',
        );
      if (
        await tx.hostEarning.count({
          where: {
            hostId: userId,
            payoutStatus: {
              in: ['PENDING', 'ELIGIBLE', 'PROCESSING', 'ON_HOLD'],
            },
            netPayout: { gt: 0 },
          },
        })
      )
        throw new ConflictException(
          'Resolve outstanding host earnings before deleting this account',
        );
      await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: user.deletedAt || new Date(),
          identityDeletionPending: true,
          email: null,
          phone: null,
          displayName: 'Deleted Account',
          photoUrl: null,
          bio: null,
          location: null,
          gender: null,
          dob: null,
          emailVerified: false,
          phoneVerified: false,
          roles: [],
          isAdmin: false,
          adminRole: null,
          isSuperhost: false,
          isStarhost: false,
          isHostVerified: false,
          isHostPro: false,
          hostProExpiresAt: null,
          hostStatus: 'SUSPENDED',
        },
      });
      await tx.property.updateMany({
        where: { hostId: userId },
        data: { status: 'PAUSED' },
      });
      await tx.hostLead.deleteMany({ where: { userId } });
      await tx.qubeConversation.deleteMany({ where: { userId } });
      await tx.experience.updateMany({
        where: { hostId: userId },
        data: { status: 'PAUSED' },
      });
      await tx.property.updateMany({
        where: { hostId: userId },
        data: {
          ownerIdProofDocUrl: null,
          selfieFaceProofDocUrl: null,
          wifiPassword: null,
          wifiSsid: null,
          accessInstructions: null,
        },
      });
      await tx.deviceToken.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { userId } });
      await tx.wishlist.deleteMany({ where: { userId } });
      await tx.savedSearch.deleteMany({ where: { userId } });
      await tx.hostPayoutAccount.deleteMany({ where: { userId } });
      await tx.otpSession.deleteMany({ where: { userId } });
      await tx.verificationChallenge.deleteMany({ where: { userId } });
      await tx.message.updateMany({
        where: { senderId: userId },
        data: { text: '[Deleted account message]', imageUrl: null },
      });
      await tx.supportTicket.updateMany({
        where: { userId },
        data: {
          email: '',
          name: 'Deleted Account',
          message: '[Deleted account request]',
        },
      });
      await tx.supportMessage.updateMany({
        where: { authorId: userId },
        data: {
          body: '[Deleted account message]',
          authorName: 'Deleted Account',
          attachments: [],
        },
      });
      await tx.domainJob.upsert({
        where: { key: 'identity-delete:' + userId },
        create: {
          key: 'identity-delete:' + userId,
          type: 'IDENTITY_DELETE',
          referenceId: userId,
        },
        update: { completedAt: null },
      });
    });
    return { success: true, deleted: true, identityDeletionPending: true };
  }
}
