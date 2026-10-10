import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter } from 'events';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';
import { text, idempotencyKey, fingerprint } from '../common/utils/input.util';
const person = {
  id: true,
  firebaseUid: true,
  displayName: true,
  photoUrl: true,
};
const relations = {
  guest: { select: person },
  host: { select: person },
  property: { select: { id: true, title: true, images: true, city: true } },
};
export function messageView(m: any) {
  return { ...m, senderId: m.sender?.firebaseUid || m.senderId };
}
@Injectable()
export class MessagingService {
  readonly events = new EventEmitter();
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}
  async resolveUserId(identifier: string): Promise<string> {
    if (!identifier)
      throw new BadRequestException('User identifier is required');
    const u = await this.prisma.user.findFirst({
      where: {
        OR: [{ id: identifier }, { firebaseUid: identifier }],
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!u) throw new NotFoundException('User not found');
    return u.id;
  }
  async getUserConversations(raw: string) {
    const id = await this.resolveUserId(raw);
    const rows = await this.prisma.conversation.findMany({
      where: { OR: [{ guestId: id }, { hostId: id }] },
      include: {
        ...relations,
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { sender: { select: person } },
        },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
      take: 200,
    });
    return rows.map((r) => ({ ...r, messages: r.messages.map(messageView) }));
  }
  async getConversation(raw: string, id: string) {
    const userId = await this.resolveUserId(raw);
    const c = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        ...relations,
        messages: {
          take: 200,
          orderBy: { createdAt: 'desc' },
          include: { sender: { select: person } },
        },
      },
    });
    if (!c) throw new NotFoundException('Conversation not found');
    if (c.guestId !== userId && c.hostId !== userId)
      throw new ForbiddenException('Access denied');
    return { ...c, messages: c.messages.reverse().map(messageView) };
  }
  async createConversation(
    rawActor: string,
    rawHost: string,
    propertyId?: string,
    bookingId?: string,
  ) {
    let guestId = await this.resolveUserId(rawActor);
    let hostId: string;
    if (bookingId) {
      const b = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: { property: true },
      });
      if (!b) throw new NotFoundException('Booking not found');
      if (guestId !== b.guestId && guestId !== b.property.hostId)
        throw new ForbiddenException('Booking participant required');
      if (propertyId && propertyId !== b.propertyId)
        throw new BadRequestException('Property does not match booking');
      propertyId = b.propertyId;
      hostId = b.property.hostId;
      guestId = b.guestId;
    } else if (propertyId) {
      const p = await this.prisma.property.findUnique({
        where: { id: propertyId },
        include: { host: { select: { deletedAt: true, hostStatus: true } } },
      });
      if (
        !p ||
        p.status !== 'ACTIVE' ||
        p.host.deletedAt ||
        p.host.hostStatus === 'SUSPENDED'
      )
        throw new NotFoundException('Published property not found');
      hostId = p.hostId;
    } else {
      hostId = await this.resolveUserId(rawHost);
      const admins = await this.prisma.user.count({
        where: {
          id: { in: [guestId, hostId] },
          isAdmin: true,
          deletedAt: null,
        },
      });
      if (!admins)
        throw new BadRequestException(
          'A booking or published property is required',
        );
    }
    if (guestId === hostId)
      throw new BadRequestException('Cannot message yourself');
    const key = fingerprint({
      pair: [guestId, hostId].sort(),
      propertyId: propertyId || null,
      bookingId: bookingId || null,
    });
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key},0))`;
      const existing = await tx.conversation.findFirst({
        where: {
          propertyId: propertyId || null,
          bookingId: bookingId || null,
          OR: [
            { guestId, hostId },
            { guestId: hostId, hostId: guestId },
          ],
        },
        include: relations,
      });
      return (
        existing ||
        tx.conversation.create({
          data: { guestId, hostId, propertyId, bookingId },
          include: relations,
        })
      );
    });
  }
  async sendMessage(
    raw: string,
    conversationId: string,
    body: string,
    imageUrl?: string,
    clientMessageId?: string,
  ) {
    const senderId = await this.resolveUserId(raw);
    const content =
      body === undefined || body === '' ? '' : text(body, 'message', 4000);
    if (imageUrl) {
      let u: URL;
      try {
        u = new URL(imageUrl);
      } catch {
        throw new BadRequestException('Invalid attachment URL');
      }
      if (
        u.protocol !== 'https:' ||
        u.username ||
        u.password ||
        imageUrl.length > 2048
      )
        throw new BadRequestException('Invalid attachment URL');
    }
    if (!content && !imageUrl)
      throw new BadRequestException('Message is empty');
    const clientId = clientMessageId
      ? idempotencyKey(clientMessageId)
      : undefined;
    const result = await this.prisma.$transaction(async (tx) => {
      const c = await tx.conversation.findUnique({
        where: { id: conversationId },
        include: { guest: { select: person }, host: { select: person } },
      });
      if (!c) throw new NotFoundException('Conversation not found');
      if (c.guestId !== senderId && c.hostId !== senderId)
        throw new ForbiddenException('Access denied');
      if (clientId) {
        const key = 'message:' + senderId + ':' + clientId;
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key},0))`;
        const prior = await tx.message.findUnique({
          where: {
            senderId_clientMessageId: { senderId, clientMessageId: clientId },
          },
          include: { sender: { select: person } },
        });
        if (prior) {
          if (
            prior.conversationId !== conversationId ||
            prior.text !== content ||
            (prior.imageUrl || null) !== (imageUrl || null)
          )
            throw new ConflictException('Message key has conflicting content');
          return { message: prior, conversation: c, replay: true };
        }
      }
      const message = await tx.message.create({
        data: {
          conversationId,
          senderId,
          text: content,
          imageUrl,
          clientMessageId: clientId,
        },
        include: { sender: { select: person } },
      });
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: message.createdAt },
      });
      await tx.domainJob.create({
        data: {
          key: 'message:' + message.id,
          type: 'MESSAGE_NOTIFICATION',
          referenceId: message.id,
        },
      });
      return { message, conversation: c, replay: false };
    });
    const message = messageView(result.message);
    if (!result.replay) {
      this.events.emit('message', {
        message,
        rooms: [
          result.conversation.guestId,
          result.conversation.hostId,
          result.conversation.guest.firebaseUid,
          result.conversation.host.firebaseUid,
        ],
      });

      // Dispatch instant push & in-app notification to the recipient (both sides)
      const recipientId =
        result.conversation.guestId === senderId
          ? result.conversation.hostId
          : result.conversation.guestId;
      const senderName =
        result.message.sender?.displayName || 'StayQ Message';
      const previewText =
        content?.slice(0, 100) ||
        (imageUrl ? 'Sent an attachment' : 'New message');

      this.notifications
        .sendNotification(
          recipientId,
          NotificationType.NEW_MESSAGE,
          senderName,
          previewText,
          {
            conversationId,
            messageId: result.message.id,
            senderId,
            type: 'NEW_MESSAGE',
            eventKey: 'message:' + result.message.id,
          },
        )
        .catch(() => {
          // Push notification errors are non-fatal
        });
    }
    return { ...result, message };
  }
}
