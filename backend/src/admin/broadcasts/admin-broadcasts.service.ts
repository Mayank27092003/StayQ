import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BroadcastStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditService } from '../audit/admin-audit.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { toSkipTake } from '../dto/pagination.dto';
import { BroadcastQueryDto } from './dto/broadcast.dto';
import { text } from '../../common/utils/input.util';
@Injectable()
export class AdminBroadcastsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly notifications: NotificationsService,
  ) {}
  async list(query: BroadcastQueryDto) {
    const { skip, take } = toSkipTake(query);
    const where: Prisma.BroadcastWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.audience) where.targetAudience = query.audience;
    const [data, total, totals, activeUsers] = await Promise.all([
      this.prisma.broadcast.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.broadcast.count({ where }),
      this.prisma.broadcast.aggregate({
        _sum: { deliveredCount: true, failedCount: true },
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
    ]);
    const delivered = totals._sum.deliveredCount || 0,
      failed = totals._sum.failedCount || 0;
    return {
      data,
      total,
      summary: {
        deliveryRate:
          delivered + failed
            ? `${((100 * delivered) / (delivered + failed)).toFixed(1)}%`
            : null,
        deliveryMetric: 'IN_APP_NOTIFICATION_CREATED',
        dispatchedCount: delivered,
        activeUsers,
      },
    };
  }
  async createAndDispatch(payload: any, adminId: string) {
    const title = text(payload.title || payload.messageTitle, 'Title', 200),
      body = text(payload.message || payload.body, 'Message', 4000);
    let rawAudience = String(
      payload.audience || payload.targetAudience || 'all',
    ).toLowerCase().trim();

    let targetAudience = 'all';
    if (rawAudience.includes('host') && !rawAudience.includes('guest')) {
      targetAudience = 'hosts';
    } else if (rawAudience.includes('guest') && !rawAudience.includes('host')) {
      targetAudience = 'guests';
    } else {
      targetAudience = 'all';
    }
    const created = await this.audit.runWithAudit(
      (tx) =>
        tx.broadcast.create({
          data: { adminId, title, body, targetAudience, status: 'DRAFT' },
        }),
      (r) => ({
        adminId,
        action: 'CREATE_BROADCAST',
        targetType: 'BROADCAST',
        targetId: r.id,
        details: { targetAudience },
      }),
    );
    return this.send(created.id, adminId);
  }
  async send(id: string, adminId: string) {
    return this.audit.runWithAudit(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Broadcast" WHERE id=${id} FOR UPDATE`;
        const broadcast = await tx.broadcast.findUnique({ where: { id } });
        if (!broadcast) throw new NotFoundException('Broadcast not found');
        if (broadcast.status !== 'DRAFT')
          throw new BadRequestException(
            'Only a draft broadcast can be dispatched',
          );
        const where: Prisma.UserWhereInput = { deletedAt: null };
        if (broadcast.targetAudience === 'hosts')
          where.roles = { has: UserRole.HOST };
        else if (broadcast.targetAudience === 'guests')
          where.roles = { has: UserRole.GUEST };
        const recipients = await tx.user.findMany({
          where,
          select: { id: true },
          take: 5001,
        });
        if (recipients.length > 5000)
          throw new BadRequestException(
            'This audience exceeds the 5,000-recipient batch limit',
          );
        if (recipients.length)
          await tx.domainJob.createMany({
            data: recipients.map((u) => ({
              key: `broadcast:${id}:${u.id}`,
              type: 'BROADCAST_MESSAGE',
              referenceId: `${id}:${u.id}`,
            })),
            skipDuplicates: true,
          });
        return tx.broadcast.update({
          where: { id },
          data: {
            status: recipients.length
              ? BroadcastStatus.SENDING
              : BroadcastStatus.SENT,
            recipientCount: recipients.length,
            sentAt: recipients.length ? null : new Date(),
          },
        });
      },
      (r) => ({
        adminId,
        action: 'QUEUE_BROADCAST',
        targetType: 'BROADCAST',
        targetId: r.id,
        details: { recipientCount: r.recipientCount, status: r.status },
      }),
    );
  }
  async delete(id: string, adminId: string) {
    await this.audit.runWithAudit(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Broadcast" WHERE id=${id} FOR UPDATE`;
        const b = await tx.broadcast.findUnique({ where: { id } });
        if (!b) throw new NotFoundException('Broadcast not found');
        if (b.status !== 'DRAFT')
          throw new BadRequestException('Only draft broadcasts can be deleted');
        return tx.broadcast.delete({ where: { id } });
      },
      (r) => ({
        adminId,
        action: 'DELETE_BROADCAST',
        targetType: 'BROADCAST',
        targetId: r.id,
        details: {},
      }),
    );
    return { id, deleted: true };
  }
}
