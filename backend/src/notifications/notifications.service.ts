import { Injectable, NotFoundException } from '@nestjs/common';
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
    return this.prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
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

  async updatePreferences(
    userId: string,
    data: { pushEnabled?: boolean; emailEnabled?: boolean; smsEnabled?: boolean },
  ) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });
  }

  async sendNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: any,
  ) {
    const prefs = await this.getPreferences(userId);

    // 1. Create in-app notification record in Postgres
    const notification = await this.prisma.notification.create({
      data: { userId, type, title, body, data: data || {} },
    });

    // 2. Deliver via Firebase Cloud Messaging if push is enabled
    if (prefs.pushEnabled !== false) {
      const tokens = await this.prisma.deviceToken.findMany({ where: { userId } });
      const tokenStrings = tokens.map((t) => t.token);

      if (tokenStrings.length > 0) {
        try {
          // FCM v1 requires all data payload values to be strings
          const sanitizedData: Record<string, string> = {
            type: type.toString(),
            notificationId: notification.id,
          };
          if (data && typeof data === 'object') {
            for (const [key, val] of Object.entries(data)) {
              sanitizedData[key] = typeof val === 'string' ? val : JSON.stringify(val);
            }
          }

          const { getMessaging } = require('firebase-admin/messaging');
          const batchResponse = await getMessaging().sendEachForMulticast({
            tokens: tokenStrings,
            notification: { title, body },
            data: sanitizedData,
            android: {
              priority: 'high',
              notification: {
                channelId: 'stayq_high_importance',
                sound: 'default',
                priority: 'high',
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                },
              },
            },
          });

          // 3. Prune stale / unregistered tokens
          const deadTokens: string[] = [];
          batchResponse.responses.forEach((resp: any, idx: number) => {
            if (!resp.success && resp.error) {
              const code = resp.error.code;
              if (
                code === 'messaging/registration-token-not-registered' ||
                code === 'messaging/invalid-registration-token'
              ) {
                deadTokens.push(tokenStrings[idx]);
              }
            }
          });

          if (deadTokens.length > 0) {
            await this.prisma.deviceToken.deleteMany({
              where: { token: { in: deadTokens } },
            });
            console.log(`[NotificationsService] Pruned ${deadTokens.length} dead FCM tokens.`);
          }

          console.log(
            `[NotificationsService] Sent push to ${tokenStrings.length} device(s) for user ${userId}. Success: ${batchResponse.successCount}, Failed: ${batchResponse.failureCount}`,
          );
        } catch (e) {
          console.error('[NotificationsService] FCM Error:', e);
        }
      }
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
    if (!user) return;

    const tokens = await this.prisma.deviceToken.findMany({ where: { userId: user.id } });
    if (tokens.length === 0) return;

    try {
      const { getMessaging } = require('firebase-admin/messaging');
      await getMessaging().sendEachForMulticast({
        tokens: tokens.map((t) => t.token),
        notification: { title, body },
        data: { ticketImage: base64Image },
        android: {
          priority: 'high',
          notification: {
            channelId: 'stayq_high_importance',
            image: 'data:image/png;base64,' + base64Image.substring(0, 100),
          },
        },
      });
      console.log(`[NotificationsService] Sent Rich Cruise Ticket Push to ${user.displayName}`);
    } catch (e) {
      console.error('[NotificationsService] FCM Rich Push Error:', e);
    }
  }
}
