import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnModuleDestroy } from '@nestjs/common';
import { getAuth } from 'firebase-admin/auth';
import { MessagingService } from './messaging.service';
import { PrismaService } from '../prisma/prisma.service';
@WebSocketGateway({
  cors: {
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allowed?: boolean) => void,
    ) => {
      const allowed =
        !origin ||
        (process.env.CORS_ORIGINS || '')
          .split(',')
          .map((x) => x.trim())
          .includes(origin);
      callback(allowed ? null : new Error('Origin is not allowed'), allowed);
    },
  },
  maxHttpBufferSize: 100000,
})
export class MessagingGateway
  implements
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    OnModuleDestroy
{
  @WebSocketServer() server: Server;
  private broadcast = (event: any) =>
    this.server?.to(event.rooms).emit('newMessage', event.message);
  constructor(
    private messaging: MessagingService,
    private prisma: PrismaService,
  ) {}
  afterInit() {
    this.messaging.events.on('message', this.broadcast);
  }
  onModuleDestroy() {
    this.messaging.events.off('message', this.broadcast);
  }
  async handleConnection(client: Socket) {
    const h = client.handshake.headers.authorization;
    const token =
      typeof h === 'string' && h.startsWith('Bearer ')
        ? h.slice(7)
        : client.handshake.auth?.token;
    if (typeof token !== 'string') {
      client.disconnect(true);
      return;
    }
    const validate = async () => {
      try {
        const d = await getAuth().verifyIdToken(token, true);
        const u = await this.prisma.user.findUnique({
          where: { firebaseUid: d.uid },
          select: { id: true, deletedAt: true },
        });
        if (!u || u.deletedAt || d.exp * 1000 <= Date.now())
          throw new Error('Invalid identity');
        await client.join([u.id, d.uid]);
        if (client.connected) {
          client.data.authTimer = setTimeout(
            () => void validate(),
            Math.min(60000, d.exp * 1000 - Date.now()),
          );
          client.data.authTimer.unref();
        }
      } catch {
        client.disconnect(true);
      }
    };
    await validate();
  }
  handleDisconnect(client: Socket) {
    clearTimeout(client.data.authTimer);
  }
}
