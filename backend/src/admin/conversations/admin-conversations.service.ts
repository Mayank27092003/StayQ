import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listConversations(query: { search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 25));
    const skip = (page - 1) * limit;

    const where: Prisma.ConversationWhereInput = {};
    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { guest: { displayName: { contains: s, mode: 'insensitive' } } },
        { guest: { email: { contains: s, mode: 'insensitive' } } },
        { guest: { phone: { contains: s, mode: 'insensitive' } } },
        { host: { displayName: { contains: s, mode: 'insensitive' } } },
        { host: { email: { contains: s, mode: 'insensitive' } } },
        { property: { title: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          guest: {
            select: { id: true, displayName: true, email: true, phone: true, photoUrl: true },
          },
          host: {
            select: { id: true, displayName: true, email: true, phone: true, photoUrl: true },
          },
          property: {
            select: { id: true, title: true, city: true, pricePerNight: true },
          },
          booking: {
            select: { id: true, status: true, checkIn: true, checkOut: true, totalAmount: true },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, text: true, createdAt: true, senderId: true },
          },
          _count: {
            select: { messages: true },
          },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return {
      items: conversations.map((c) => ({
        id: c.id,
        guest: c.guest,
        host: c.host,
        property: c.property,
        booking: c.booking,
        lastMessage: c.messages[0] || null,
        messageCount: c._count.messages,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getConversation(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        guest: {
          select: { id: true, displayName: true, email: true, phone: true, photoUrl: true },
        },
        host: {
          select: { id: true, displayName: true, email: true, phone: true, photoUrl: true },
        },
        property: {
          select: { id: true, title: true, city: true, pricePerNight: true },
        },
        booking: {
          select: { id: true, status: true, checkIn: true, checkOut: true, totalAmount: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, displayName: true, roles: true, photoUrl: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }
}
