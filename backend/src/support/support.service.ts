import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);
  private client: OpenAI;
  private model: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {
    const apiKey =
      this.configService.get<string>('DEEPSEEK_API_KEY') ||
      process.env.DEEPSEEK_API_KEY ||
      'sk-fc32eea03eba47128edece46d949af8c';
    const baseURL =
      this.configService.get<string>('DEEPSEEK_BASE_URL') ||
      process.env.DEEPSEEK_BASE_URL ||
      'https://api.deepseek.com';
    this.model =
      this.configService.get<string>('DEEPSEEK_MODEL') ||
      process.env.DEEPSEEK_MODEL ||
      'deepseek-chat';

    this.client = new OpenAI({ apiKey, baseURL });
  }

  /**
   * Tier-1 AI Triage Assistant:
   * Provides instant, intelligent, policy-backed resolutions for guests & hosts before escalating.
   */
  async aiTriage(
    message: string,
    topic?: string,
    chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  ) {
    try {
      const systemPrompt = `You are Qube, Stay Q's 24/7 AI Customer Support & Guest Concierge.
You are helping guests, travelers, and hosts with their questions about stays, boutique villas, RV campervans, cancellations, refunds, key access, or zero-broker lofts.

YOUR PERSONALITY & TONE:
- Warm, polite, reassuring, empathetic, and genuinely helpful. Never sound like a generic robotic script.
- Language adaptive:
  - If user writes in Hinglish, reply in warm, natural Hinglish (Roman script).
  - If user writes in Hindi, reply in polite, fluent Hindi.
  - If user writes in English, reply in polished, world-class concierge English.
- Keep answers crisp, clear, and reassuring (3-5 sentences or short bullets).

REAL STAY Q POLICIES:
1. Cancellations & Refunds: 100% full refund if cancelled at least 48 hours before check-in. If within 48 hours, first night is non-refundable + 50% for remaining nights. Refunds process back to original bank/UPI account within 3-5 business days.
2. Check-in & Key Access: Digital check-in codes, smart lock PINs, and GPS pins are available in "My Trips" tab 24 hours prior to check-in. If lock or keybox fails, hosts must provide 24/7 backup contact.
3. Host Not Responding: If host does not reply within 1 hour for an active or upcoming check-in, Stay Q Operations will step in, call the host directly, or re-accommodate the guest at an equal or upgraded luxury stay at zero extra charge.
4. RV & Campervans: All campervans include 220V shore power hookup, water refill, 24/7 roadside assistance, and verified pit-stops.
5. Zero-Brokerage Living: 0% brokerage fee, standard 1-month refundable security deposit, verified contracts.

WHEN TO ESCALATE:
If the user's issue cannot be resolved by information alone (e.g. host unreachable at property, lock failure right now, refund exception, payment deduction error), reassure them warmly:
"Don't worry, switch to the 'Transfer to Agent' tab above and our operations team will call or WhatsApp you directly within minutes!"`;

      const formattedMessages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
      }> = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.slice(-6).map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        {
          role: 'user',
          content: topic ? `[Topic: ${topic}] ${message}` : message,
        },
      ];

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 450,
      });

      return (
        completion.choices[0]?.message?.content ||
        this.getFallbackReply(message, topic)
      );
    } catch (err) {
      this.logger.error('Support AI Triage Error:', err);
      return this.getFallbackReply(message, topic);
    }
  }

  private getFallbackReply(message: string, topic?: string): string {
    const q = (message + ' ' + (topic || '')).toLowerCase();
    if (q.includes('cancellation') || q.includes('refund')) {
      return `💳 **Stay Q Cancellation Policy**: You receive a **100% full refund** if cancelled at least 48 hours prior to check-in. Refunds process in 3-5 business days.\n\nWould you like me to connect you with a Support Agent to process this right away?`;
    }
    if (q.includes('check-in') || q.includes('key') || q.includes('lock')) {
      return `🔑 **Check-in Instructions**: Your digital pass and keycode are located in your **My Trips** tab. If you are at the property and cannot unlock the door, click **Transfer to Agent** above for emergency host dispatch!`;
    }
    if (
      q.includes('host') &&
      (q.includes('respond') ||
        q.includes('not answering') ||
        q.includes('reach'))
    ) {
      return `📞 **Host Outreach Guarantee**: Hosts are committed to fast response times. If you have an active reservation and cannot reach the host, our operations team will call them directly or arrange an upgraded stay. Click **Transfer to Agent** to escalate immediately.`;
    }
    return `✨ I'm here to assist you with your Stay Q reservation, host coordination, check-in instructions, or billing inquiries. How can I help you today?`;
  }

  /**
   * Create a Real Support Ticket in Database & Send Confirmation Email
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

    const fullDescription =
      data.chatTranscript && data.chatTranscript.length > 0
        ? `${data.message}\n\n--- AI PRE-TRIAGE CHAT TRANSCRIPT ---\n` +
          data.chatTranscript
            .map((t) => `[${t.sender.toUpperCase()}]: ${t.text}`)
            .join('\n')
        : data.message;

    const ticket = await this.prisma.supportTicket.create({
      data: {
        name: data.name || 'Guest User',
        email: data.email || 'grievance@stayq.space',
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

    // Send Real Confirmation Email via Hostinger SSL SMTP (hello@stayq.space)
    if (data.email && data.email.includes('@')) {
      try {
        const emailHtml = `
<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #6366f1; margin: 0; font-size: 26px; font-weight: 800;">Stay Q</h1>
    <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">24/7 Operations & Priority Concierge Desk</p>
  </div>
  <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #6366f1;">
    <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Ticket Reference</p>
    <p style="margin: 0; font-size: 22px; font-weight: 800; color: #6366f1; letter-spacing: 1px;">${ticketRef}</p>
  </div>
  <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Hello <strong>${data.name || 'Valued Guest'}</strong>,</p>
  <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
    Your support request has been registered and assigned to a Senior Stay Q Support Executive.
  </p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
    <tr><td style="padding: 8px 0; color: #64748b; width: 35%;">Category:</td><td style="padding: 8px 0; font-weight: 600;">${data.category || 'General Support'}</td></tr>
    <tr><td style="padding: 8px 0; color: #64748b;">Priority:</td><td style="padding: 8px 0; font-weight: 600; color: #ef4444;">${data.priority || 'HIGH'}</td></tr>
    <tr><td style="padding: 8px 0; color: #64748b;">Phone:</td><td style="padding: 8px 0; font-weight: 600;">${data.phone || 'Provided via profile'}</td></tr>
    <tr><td style="padding: 8px 0; color: #64748b;">Expected Contact:</td><td style="padding: 8px 0; font-weight: 600; color: #10b981;">Within 15-30 mins</td></tr>
  </table>
  <div style="background-color: #f1f5f9; padding: 14px; border-radius: 10px; margin-bottom: 20px;">
    <p style="margin: 0 0 4px 0; font-weight: 700; font-size: 13px; color: #334155;">Issue Summary:</p>
    <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">${data.message}</p>
  </div>
  <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 12px 0;">
    For urgent issues, you can also reach us directly on WhatsApp at <strong>+91 9225270718</strong>.
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
    Stay Q Luxury Living & Overland Experiences • hello@stayq.space
  </p>
</div>
        `;
        await this.emailService.sendEmail(
          data.email,
          `[${ticketRef}] Stay Q Priority Support Dispatched: ${data.subject || 'Inquiry'}`,
          emailHtml,
          true,
        );
      } catch (emailErr) {
        this.logger.error('Failed to send ticket confirmation email:', emailErr);
      }
    }

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
