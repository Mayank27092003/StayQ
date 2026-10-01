import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to resolve any identifier (Postgres UUID, Firebase UID, or Property ID) to a User ID (UUID)
   */
  async resolveUserId(identifier: string): Promise<string> {
    if (!identifier) return identifier;

    // 1. Direct User.id check
    const userById = await this.prisma.user.findUnique({
      where: { id: identifier },
      select: { id: true }
    });
    if (userById) return userById.id;

    // 2. User.firebaseUid check
    const userByFirebase = await this.prisma.user.findUnique({
      where: { firebaseUid: identifier },
      select: { id: true }
    });
    if (userByFirebase) return userByFirebase.id;

    // 3. Property.id check (Property owned by hostId which is User.id)
    const propertyRecord = await this.prisma.property.findUnique({
      where: { id: identifier },
      select: { hostId: true }
    });
    if (propertyRecord?.hostId) return propertyRecord.hostId;

    return identifier;
  }

  async getUserConversations(rawUserId: string) {
    const userId = await this.resolveUserId(rawUserId);

    return this.prisma.conversation.findMany({
      where: {
        OR: [
          { guestId: userId },
          { hostId: userId }
        ]
      },
      include: {
        guest: { select: { id: true, firebaseUid: true, displayName: true, photoUrl: true } },
        host: { select: { id: true, firebaseUid: true, displayName: true, photoUrl: true } },
        property: { select: { id: true, title: true, images: true, city: true } },
        messages: { take: 1, orderBy: { createdAt: 'desc' } }
      },
      orderBy: { lastMessageAt: 'desc' }
    });
  }

  async getConversation(rawUserId: string, conversationId: string) {
    const userId = await this.resolveUserId(rawUserId);

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        guest: { select: { id: true, firebaseUid: true, displayName: true, photoUrl: true } },
        host: { select: { id: true, firebaseUid: true, displayName: true, photoUrl: true } },
        property: { select: { id: true, title: true, images: true, city: true } },
        messages: { 
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, firebaseUid: true, displayName: true, photoUrl: true } } }
        }
      }
    });

    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.guestId !== userId && conversation.hostId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return conversation;
  }

  async createConversation(rawGuestId: string, rawHostId: string, propertyId?: string, bookingId?: string) {
    const guestId = await this.resolveUserId(rawGuestId);
    let hostId = await this.resolveUserId(rawHostId);

    // If propertyId was provided and hostId was not resolved or is same as guest, infer from property
    if (propertyId && (!hostId || hostId === guestId)) {
      const prop = await this.prisma.property.findUnique({
        where: { id: propertyId },
        select: { hostId: true }
      });
      if (prop?.hostId) {
        hostId = prop.hostId;
      }
    }

    if (!hostId) {
      throw new NotFoundException('Host not found for conversation');
    }


    const existing = await this.prisma.conversation.findFirst({
      where: {
        guestId,
        hostId,
        ...(propertyId && { propertyId }),
        ...(bookingId && { bookingId }),
      },
      include: {
        guest: { select: { id: true, firebaseUid: true, displayName: true, photoUrl: true } },
        host: { select: { id: true, firebaseUid: true, displayName: true, photoUrl: true } },
        property: { select: { id: true, title: true, images: true } }
      }
    });

    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        guestId,
        hostId,
        propertyId: propertyId || undefined,
        bookingId: bookingId || undefined,
        lastMessageAt: new Date(),
      },
      include: {
        guest: { select: { id: true, firebaseUid: true, displayName: true, photoUrl: true } },
        host: { select: { id: true, firebaseUid: true, displayName: true, photoUrl: true } },
        property: { select: { id: true, title: true, images: true } }
      }
    });
  }

  async sendMessage(rawSenderId: string, conversationId: string, text: string, imageUrl?: string) {
    const senderId = await this.resolveUserId(rawSenderId);

    const conversation = await this.prisma.conversation.findUnique({ 
      where: { id: conversationId },
      include: {
        guest: { select: { id: true, firebaseUid: true } },
        host: { select: { id: true, firebaseUid: true } }
      }
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.guestId !== senderId && conversation.hostId !== senderId) {
      throw new ForbiddenException('Access denied');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        text,
        imageUrl,
      },
      include: {
        sender: { select: { id: true, firebaseUid: true, displayName: true, photoUrl: true } }
      }
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    return {
      message,
      conversation,
      recipientId: conversation.guestId === senderId ? conversation.hostId : conversation.guestId,
      recipientFirebaseUid: conversation.guestId === senderId ? conversation.host.firebaseUid : conversation.guest.firebaseUid,
    };
  }
}

