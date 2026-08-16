import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() }
    });
  }

  async saveDeviceToken(userId: string, token: string, platform: string) {
    return this.prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform }
    });
  }

  async getPreferences(userId: string) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async updatePreferences(userId: string, data: { pushEnabled?: boolean; emailEnabled?: boolean; smsEnabled?: boolean }) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data
      }
    });
  }

  async sendNotification(userId: string, type: NotificationType, title: string, body: string, data?: any) {
    const prefs = await this.getPreferences(userId);
    
    const notification = await this.prisma.notification.create({
      data: { userId, type, title, body, data: data || {} }
    });

    if (prefs.pushEnabled) {
      const tokens = await this.prisma.deviceToken.findMany({ where: { userId } });
      const tokenStrings = tokens.map(t => t.token);
      
      if (tokenStrings.length > 0) {
        try {
          const { getMessaging } = require('firebase-admin/messaging');
          await getMessaging().sendEachForMulticast({
            tokens: tokenStrings,
            notification: { title, body },
            data: data || {},
          });
          console.log(`Sent push to ${tokenStrings.length} devices.`);
        } catch (e) {
          console.error('FCM Error:', e);
        }
      }
    }
    return notification;
  }

  async sendRichPushNotification(firebaseUid: string, title: string, body: string, base64Image: string) {
    const user = await this.prisma.user.findUnique({ where: { firebaseUid } });
    if (!user) return;
    
    const tokens = await this.prisma.deviceToken.findMany({ where: { userId: user.id } });
    if (tokens.length === 0) return;

    try {
      const { getMessaging } = require('firebase-admin/messaging');
      await getMessaging().sendEachForMulticast({
        tokens: tokens.map(t => t.token),
        notification: { title, body },
        data: { ticketImage: base64Image }, // Rich payload
        android: {
          notification: { image: 'data:image/png;base64,' + base64Image.substring(0, 100) } // Mocking rich payload 
        }
      });
      console.log(`Sent Rich Cruise Ticket Push to ${user.displayName}`);
    } catch (e) {
      console.error('FCM Rich Push Error:', e);
    }
  }
}
