import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagingService } from './messaging.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@WebSocketGateway({ cors: { origin: '*' } })
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messagingService: MessagingService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: Socket) {
    const rawUserId = client.handshake.query.userId as string;
    if (rawUserId) {
      client.join(rawUserId);
      try {
        const resolvedId = await this.messagingService.resolveUserId(rawUserId);
        if (resolvedId && resolvedId !== rawUserId) {
          client.join(resolvedId);
        }
      } catch (e) {
        // ignore resolution error on connect
      }
    }
  }

  handleDisconnect(client: Socket) {
    // Client disconnects automatically handled by socket.io
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; text: string; imageUrl?: string },
  ) {
    const rawSenderId = client.handshake.query.userId as string;
    if (!rawSenderId) return { error: 'Unauthorized' };

    try {
      const result = await this.messagingService.sendMessage(
        rawSenderId,
        payload.conversationId,
        payload.text,
        payload.imageUrl,
      );

      const { message, recipientId, recipientFirebaseUid } = result;

      // Broadcast to both recipient rooms for real-time in-app delivery
      if (recipientId) {
        this.server.to(recipientId).emit('newMessage', message);
      }
      if (recipientFirebaseUid && recipientFirebaseUid !== recipientId) {
        this.server.to(recipientFirebaseUid).emit('newMessage', message);
      }

      // Push notification for background/offline recipients
      if (recipientId) {
        const senderName = message.sender?.displayName || 'New Message';
        const snippet = payload.text
          ? payload.text.length > 80
            ? payload.text.substring(0, 80) + '...'
            : payload.text
          : 'Sent an attachment';

        this.notificationsService
          .sendNotification(recipientId, NotificationType.NEW_MESSAGE, senderName, snippet, {
            conversationId: payload.conversationId,
            senderId: rawSenderId,
          })
          .catch((err) =>
            console.error('[MessagingGateway] Failed to dispatch chat push notification:', err),
          );
      }

      return { success: true, message };
    } catch (e: any) {
      return { error: e.message };
    }
  }
}
