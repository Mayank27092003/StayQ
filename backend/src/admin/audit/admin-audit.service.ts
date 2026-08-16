import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type AuditTargetType =
  | 'USER'
  | 'ADMIN_USER'
  | 'PROPERTY'
  | 'BOOKING'
  | 'PAYMENT'
  | 'REVIEW'
  | 'PROMOTION'
  | 'SUPPORT_TICKET'
  | 'BROADCAST'
  | 'HOST';

export interface AuditEntry {
  adminId: string;
  action: string;
  targetType: AuditTargetType;
  targetId: string;
  details?: Prisma.InputJsonValue;
}

/**
 * Append-only admin action log.
 *
 * Every privileged mutation records an entry. Prefer `runWithAudit` so the
 * business write and its audit row commit atomically; a mutation that succeeds
 * without a log (or a log without a mutation) makes the trail untrustworthy.
 */
@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Executes `mutation` and writes its audit entry inside one transaction.
   * The audit entry is derived from the mutation result so it can reference
   * server-generated values.
   */
  async runWithAudit<T>(
    mutation: (tx: Prisma.TransactionClient) => Promise<T>,
    buildEntry: (result: T) => AuditEntry,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const result = await mutation(tx);
      const entry = buildEntry(result);

      await tx.adminAuditLog.create({
        data: {
          adminId: entry.adminId,
          action: entry.action,
          targetType: entry.targetType,
          targetId: entry.targetId,
          details: entry.details ?? Prisma.JsonNull,
        },
      });

      return result;
    });
  }

  /**
   * Records an entry outside a transaction. Only for actions whose side effect
   * is not a local database write (for example an outbound delivery attempt).
   */
  async record(entry: AuditEntry): Promise<void> {
    await this.prisma.adminAuditLog.create({
      data: {
        adminId: entry.adminId,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        details: entry.details ?? Prisma.JsonNull,
      },
    });
  }
}
