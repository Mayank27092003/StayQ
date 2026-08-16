import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagingService } from './messaging.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly messagingService: MessagingService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      client.join(userId);
    }
  }

  handleDisconnect(client: Socket) {
    // Client disconnects automatically handled by socket.io
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string, text: string, imageUrl?: string }
  ) {
    const senderId = client.handshake.query.userId as string;
    if (!senderId) return { error: 'Unauthorized' };

    try {
      const message = await this.messagingService.sendMessage(
        senderId, 
        payload.conversationId, 
        payload.text, 
        payload.imageUrl
      );

      const conversation = await this.messagingService.getConversation(senderId, payload.conversationId);
      const recipientId = conversation.guestId === senderId ? conversation.hostId : conversation.guestId;
      
      this.server.to(recipientId).emit('newMessage', message);
      
      return { success: true, message };
    } catch (e: any) {
      return { error: e.message };
    }
  }
}
