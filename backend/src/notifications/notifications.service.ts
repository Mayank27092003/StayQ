import { getMessaging } from 'firebase-admin/messaging';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async saveDeviceToken(userId: string, token: string, platform: string) {
    if (
      !token ||
      typeof token !== 'string' ||
      token.trim().length < 10 ||
      token.length > 4096
    ) {
      throw new BadRequestException('Valid device token is required');
    }
    const cleanToken = token.trim();
    const cleanPlatform = ['ios', 'android', 'web'].includes(
      platform?.toLowerCase(),
    )
      ? platform.toLowerCase()
      : 'android';

    return this.prisma.deviceToken.upsert({
      where: { token: cleanToken },
      update: { userId, platform: cleanPlatform },
      create: { userId, token: cleanToken, platform: cleanPlatform },
    });
  }

  async deleteDeviceToken(userId: string, token: string) {
    return this.prisma.deviceToken.deleteMany({
      where: { userId, token },
    });
  }

  async getPreferences(userId: string) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async updatePreferences(userId: string, data: any) {
    const allowed = [
      'pushEnabled',
      'emailEnabled',
      'smsEnabled',
      'bookingUpdates',
      'messages',
      'promotions',
      'priceDrops',
      'reviewReminders',
    ];
    const clean: any = {};
    for (const key of Object.keys(data)) {
      if (!allowed.includes(key) || typeof data[key] !== 'boolean')
        throw new BadRequestException('Invalid notification preference');
      clean[key] = data[key];
    }
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: clean,
      create: { userId, ...clean },
    });
  }

  async sendNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: any,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) return null;
    const prefs = await this.getPreferences(userId);
    if (type === 'PROMOTION' && !prefs.promotions) return null;
    const eventKey = data?.eventKey
      ? String(data.eventKey).slice(0, 200)
      : null;
    const key = eventKey ? userId + ':' + eventKey : null;
    const notification = await this.prisma.$transaction(async (tx) => {
      if (key) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key},0))`;
        const existing = await tx.notification.findUnique({
          where: { idempotencyKey: key },
        });
        if (existing) return existing;
      }
      return tx.notification.create({
        data: {
          userId,
          type,
          title: String(title).slice(0, 200),
          body: String(body).slice(0, 2000),
          data: data || {},
          idempotencyKey: key,
        },
      });
    });
    const enabled =
      prefs.pushEnabled &&
      (type === 'NEW_MESSAGE'
        ? prefs.messages
        : type === 'PROMOTION'
          ? prefs.promotions
          : type === 'REVIEW_REMINDER'
            ? prefs.reviewReminders
            : type === 'PRICE_DROP'
              ? prefs.priceDrops
              : prefs.bookingUpdates);
    if (!enabled || notification.pushSentAt) return notification;
    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId },
    });
    const payload: Record<string, string> = {
      type,
      notificationId: notification.id,
      userId: user.firebaseUid,
    };
    for (const [key, value] of Object.entries(data || {}))
      if (key !== 'userId' && key !== 'ticketImage' && value !== undefined) {
        const encoded =
          typeof value === 'string' ? value : JSON.stringify(value);
        if (encoded.length <= 1000) payload[key] = encoded;
      }
    if (Buffer.byteLength(JSON.stringify(payload)) > 3500)
      throw new BadRequestException('Push metadata is too large');
    try {
      for (let offset = 0; offset < tokens.length; offset += 500) {
        const batch = tokens.slice(offset, offset + 500);
        const response = await getMessaging().sendEachForMulticast({
          tokens: batch.map((t) => t.token),
          notification: {
            title: notification.title,
            body: notification.body.slice(0, 1000),
          },
          data: payload,
          android: {
            priority: 'high',
            notification: {
              channelId: 'stayq_high_importance',
              sound: 'default',
            },
          },
          apns: { payload: { aps: { sound: 'default' } } },
        });
        const dead: string[] = [];
        let transient = false;
        response.responses.forEach((r, i) => {
          if (!r.success) {
            if (
              [
                'messaging/registration-token-not-registered',
                'messaging/invalid-registration-token',
              ].includes(r.error?.code || '')
            )
              dead.push(batch[i].token);
            else transient = true;
          }
        });
        if (dead.length)
          await this.prisma.deviceToken.deleteMany({
            where: { userId, token: { in: dead } },
          });
        if (transient) throw new Error('Push delivery remains pending');
      }
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { pushSentAt: new Date() },
      });
    } catch (pushErr) {
      // Notification is saved to DB; push failure (e.g. invalid/expired device token) is non-fatal
    }
    return notification;
  }

  async sendRichPushNotification(
    firebaseUid: string,
    title: string,
    body: string,
    base64Image: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { firebaseUid } });
    if (!user || user.deletedAt) return;
    // Stay passes are retrieved through the authenticated booking endpoint.
    return this.sendNotification(user.id, NotificationType.SYSTEM, title, body);
  }
}
