import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Groq from 'groq-sdk';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupportService {
  private groq: Groq;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY') || process.env.GROQ_API_KEY || 'gsk_demo';
    this.groq = new Groq({ apiKey });
  }

  /**
   * Tier-1 AI Triage Assistant:
   * Provides instant, intelligent, policy-backed resolutions for guests & hosts before escalating.
   */
  async aiTriage(message: string, topic?: string, chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []) {
    try {
      const systemPrompt = `You are Stay Q's Tier-1 AI Support Specialist.
Your goal is to help guests and hosts resolve their issues quickly, politely, and accurately.

Key Stay Q Policies:
- Cancellations & Refunds: 100% full refund if cancelled at least 48 hours before check-in. Within 48 hours, the first night is non-refundable plus 50% for remaining nights. Refunds process back to the original payment method in 3-5 business days.
- Check-in & Key Access: Digital check-in codes and exact GPS pins are sent 24 hours prior to arrival. If smart lock or keybox fails, hosts are required to provide 24/7 backup contact.
- Host Non-Response: If a host does not reply within 1 hour for an active or imminent check-in, Stay Q Support will automatically step in, attempt urgent contact, or re-accommodate the guest at an equivalent or upgraded luxury stay at no extra charge.
- Zero-Broker Rentals: All zero-broker agreements are digitally verified on blockchain with 0% brokerage fee and standard 1-month refundable security deposit.
- Damage Protection: All bookings include complimentary ₹10,00,000 Stay Q Host & Property Protection.

Guidance:
- Give a direct, helpful, and reassuring answer in 2-4 sentences with clear bullet points.
- If the issue requires human intervention (e.g. host emergency, lock failure, refund exception, payment dispute), politely tell them: "If you'd like a human executive to step in, simply click 'Transfer to Human Executive' below and we'll raise an urgent ticket for you."`;

      const formattedMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...chatHistory.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: topic ? `[Topic: ${topic}] ${message}` : message },
      ];

      const completion = await this.groq.chat.completions.create({
        messages: formattedMessages,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.5,
        max_tokens: 400,
      });

      return completion.choices[0]?.message?.content || this.getFallbackReply(message, topic);
    } catch (err) {
      console.error('Support AI Triage Error:', err);
      return this.getFallbackReply(message, topic);
    }
  }

  private getFallbackReply(message: string, topic?: string): string {
    const q = (message + ' ' + (topic || '')).toLowerCase();
    if (q.includes('cancellation') || q.includes('refund')) {
      return `💳 **Stay Q Cancellation Policy**: You receive a **100% full refund** if cancelled at least 48 hours prior to check-in. Refunds process in 3-5 business days.\n\nWould you like me to connect you with a Support Agent to process this right away?`;
    }
    if (q.includes('check-in') || q.includes('key') || q.includes('lock')) {
      return `🔑 **Check-in Instructions**: Your digital pass and keycode are located in your **My Trips** tab. If you are at the property and cannot unlock the door, click **Transfer to Human Executive** below for emergency host dispatch!`;
    }
    if (q.includes('host') && (q.includes('respond') || q.includes('not answering') || q.includes('reach'))) {
      return `📞 **Host Outreach Guarantee**: Hosts are committed to fast response times. If you have an active reservation and cannot reach the host, our operations team will call them directly or arrange an upgraded stay. Click **Transfer to Human Executive** to escalate immediately.`;
    }
    return `✨ I'm here to assist you with your Stay Q reservation, host coordination, check-in instructions, or billing inquiries. How can I help you today?`;
  }

  /**
   * Create a Real Support Ticket in Database
   */
  async createTicket(data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    category?: string;
    priority?: 'NORMAL' | 'HIGH' | 'URGENT' | 'LOW';
    chatTranscript?: Array<{ sender: string; text: string }>;
    bookingId?: string;
    userId?: string;
  }) {
    const ticketRef = `SQ-TICKET-${Math.floor(100000 + Math.random() * 900000)}`;

    const fullDescription = data.chatTranscript && data.chatTranscript.length > 0
      ? `${data.message}\n\n--- AI PRE-TRIAGE CHAT TRANSCRIPT ---\n` +
        data.chatTranscript.map((t) => `[${t.sender.toUpperCase()}]: ${t.text}`).join('\n')
      : data.message;

    const ticket = await this.prisma.supportTicket.create({
      data: {
        name: data.name || 'Guest User',
        email: data.email || 'support@stayq.in',
        subject: `[${ticketRef}] ${data.subject || 'Customer Support Request'}`,
        message: fullDescription,
        category: data.category || 'General Inquiry',
        priority: (data.priority as any) || 'HIGH',
        status: 'OPEN',
        userId: data.userId || undefined,
      },
      include: {
        messages: true,
      },
    });

    return {
      ...ticket,
      ticketRef,
      estimatedWaitTime: '15-30 minutes',
      contactPhone: data.phone || 'Provided via profile',
    };
  }

  /**
   * List all tickets (Used by Admin Panel and Customer tracker)
   */
  async listTickets(query: {
    status?: string;
    category?: string;
    search?: string;
    email?: string;
  }) {
    const where: any = {};

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }
    if (query.category && query.category !== 'ALL') {
      where.category = query.category;
    }
    if (query.email) {
      where.email = query.email;
    }
    if (query.search && query.search.trim() !== '') {
      const q = query.search.trim();
      where.OR = [
        { subject: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { message: { contains: q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * Get single ticket by ID
   */
  async getTicket(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }

    return ticket;
  }

  /**
   * Update ticket status / resolution (Used by Admin Panel)
   */
  async updateTicket(id: string, data: {
    status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    resolution?: string;
    assignedTo?: string;
    priority?: 'NORMAL' | 'HIGH' | 'URGENT' | 'LOW';
  }) {
    const updateData: any = { ...data };
    if (data.status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
    }

    return this.prisma.supportTicket.update({
      where: { id },
      data: updateData,
      include: {
        messages: true,
      },
    });
  }

  /**
   * Add a message / reply to a ticket thread
   */
  async addMessage(ticketId: string, data: {
    authorType: 'USER' | 'ADMIN' | 'SYSTEM';
    authorName?: string;
    authorId?: string;
    body: string;
    internal?: boolean;
  }) {
    const message = await this.prisma.supportMessage.create({
      data: {
        ticketId,
        authorType: data.authorType as any,
        authorName: data.authorName || (data.authorType === 'ADMIN' ? 'Stay Q Executive' : 'Guest'),
        authorId: data.authorId || undefined,
        body: data.body,
        internal: data.internal || false,
      },
    });

    // If admin replies, update status to IN_PROGRESS if currently OPEN
    if (data.authorType === 'ADMIN') {
      await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: 'IN_PROGRESS',
          firstRespondedAt: new Date(),
        },
      });
    }

    return message;
  }
}
