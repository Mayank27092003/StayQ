import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagingService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        OR: [
          { guestId: userId },
          { hostId: userId }
        ]
      },
      include: {
        guest: { select: { id: true, displayName: true, photoUrl: true } },
        host: { select: { id: true, displayName: true, photoUrl: true } },
        property: { select: { id: true, title: true } },
        messages: { take: 1, orderBy: { createdAt: 'desc' } }
      },
      orderBy: { lastMessageAt: 'desc' }
    });
  }

  async getConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        guest: { select: { id: true, displayName: true, photoUrl: true } },
        host: { select: { id: true, displayName: true, photoUrl: true } },
        messages: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.guestId !== userId && conversation.hostId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return conversation;
  }

  async createConversation(guestId: string, hostId: string, propertyId?: string, bookingId?: string) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        guestId,
        hostId,
        ...(propertyId && { propertyId }),
        ...(bookingId && { bookingId }),
      }
    });

    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        guestId,
        hostId,
        propertyId,
        bookingId,
      }
    });
  }

  async sendMessage(senderId: string, conversationId: string, text: string, imageUrl?: string) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
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
        sender: { select: { id: true, displayName: true, photoUrl: true } }
      }
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    return message;
  }
}
