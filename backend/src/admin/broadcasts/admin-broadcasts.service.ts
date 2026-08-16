import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BroadcastStatus, NotificationType, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditService } from '../audit/admin-audit.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { buildPaginatedResult, PaginatedResult, toSkipTake } from '../dto/pagination.dto';
import { BroadcastQueryDto, CreateBroadcastDto } from './dto/broadcast.dto';

@Injectable()
export class AdminBroadcastsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(query: BroadcastQueryDto): Promise<PaginatedResult<unknown>> {
    const { skip, take } = toSkipTake(query);
    const where: Prisma.BroadcastWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.audience) where.targetAudience = query.audience;
    const [rows, total] = await Promise.all([
      this.prisma.broadcast.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.broadcast.count({ where }),
    ]);
    return buildPaginatedResult(rows, total, query);
  }

  async create(dto: CreateBroadcastDto, adminId: string) {
    return this.audit.runWithAudit(
      (tx) => tx.broadcast.create({
        data: { adminId, title: dto.title, body: dto.body, targetAudience: dto.targetAudience, status: BroadcastStatus.DRAFT },
      }),
      (r) => ({ adminId, action: 'CREATE_BROADCAST', targetType: 'BROADCAST', targetId: r.id, details: { title: r.title, audience: r.targetAudience } }),
    );
  }

  /**
   * Sends a broadcast now. Recipients are resolved from the database so the
   * count is real. FCM delivery is best-effort via the existing NotificationsService.
   */
  async send(id: string, adminId: string) {
    const broadcast = await this.prisma.broadcast.findUnique({ where: { id } });
    if (!broadcast) throw new NotFoundException('Broadcast not found.');
    if (broadcast.status !== BroadcastStatus.DRAFT) {
      throw new BadRequestException(`Cannot send a broadcast with status ${broadcast.status}.`);
    }

    const where: Prisma.UserWhereInput = {};
    if (broadcast.targetAudience === 'guests') where.roles = { has: UserRole.GUEST };
    else if (broadcast.targetAudience === 'hosts') where.roles = { has: UserRole.HOST };

    const recipients = await this.prisma.user.findMany({ where, select: { id: true, firebaseUid: true } });
    const recipientCount = recipients.length;

    // Mark sending immediately so a second concurrent request is blocked.
    await this.prisma.broadcast.update({ where: { id }, data: { status: BroadcastStatus.SENDING, recipientCount } });

    let delivered = 0;
    let failed = 0;
    let errorMessage: string | undefined;

    try {
      for (const user of recipients) {
        try {
          await this.notifications.sendNotification(
            user.id,
            NotificationType.PROMOTION,
            broadcast.title,
            broadcast.body,
            { broadcastId: id },
          );
          delivered++;
        } catch {
          failed++;
        }
      }
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Delivery loop failed';
    }

    const finalStatus = errorMessage ? BroadcastStatus.FAILED : BroadcastStatus.SENT;
    const updated = await this.audit.runWithAudit(
      (tx) => tx.broadcast.update({
        where: { id },
        data: { status: finalStatus, sentAt: new Date(), deliveredCount: delivered, failedCount: failed, errorMessage: errorMessage ?? null },
      }),
      (r) => ({ adminId, action: 'SEND_BROADCAST', targetType: 'BROADCAST', targetId: r.id, details: { recipientCount, delivered, failed, status: finalStatus } }),
    );
    return updated;
  }

  async delete(id: string, adminId: string) {
    const broadcast = await this.prisma.broadcast.findUnique({ where: { id } });
    if (!broadcast) throw new NotFoundException('Broadcast not found.');
    if (broadcast.status === BroadcastStatus.SENT || broadcast.status === BroadcastStatus.SENDING) {
      throw new BadRequestException('Sent or in-progress broadcasts cannot be deleted.');
    }
    await this.audit.runWithAudit(
      (tx) => tx.broadcast.delete({ where: { id } }),
      (r) => ({ adminId, action: 'DELETE_BROADCAST', targetType: 'BROADCAST', targetId: r.id, details: {} }),
    );
    return { id, deleted: true as const };
  }
}
