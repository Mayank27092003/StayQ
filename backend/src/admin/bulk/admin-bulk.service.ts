import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BulkOperationItemStatus, BulkOperationStatus, BulkOperationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditService } from '../audit/admin-audit.service';
import { buildPaginatedResult, toSkipTake } from '../dto/pagination.dto';
import { BulkItemQueryDto, BulkQueryDto, CreateBulkOperationDto } from './dto/bulk.dto';

/**
 * Bulk operations are durable job records. They never fake progress: a job
 * is PENDING until a worker starts it. Export jobs run synchronously inline
 * (small data) or return an artifact path for async retrieval.
 */
@Injectable()
export class AdminBulkService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AdminAuditService) {}

  async list(query: BulkQueryDto) {
    const { skip, take } = toSkipTake(query);
    const where: Prisma.BulkOperationWhereInput = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status as BulkOperationStatus;
    const [rows, total] = await Promise.all([
      this.prisma.bulkOperation.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take, include: { _count: { select: { items: true } } } }),
      this.prisma.bulkOperation.count({ where }),
    ]);
    return buildPaginatedResult(rows, total, query);
  }

  async findOne(id: string) {
    const op = await this.prisma.bulkOperation.findUnique({ where: { id }, include: { _count: { select: { items: true } } } });
    if (!op) throw new NotFoundException('Bulk operation not found.');
    return op;
  }

  async items(operationId: string, query: BulkItemQueryDto) {
    const op = await this.prisma.bulkOperation.findUnique({ where: { id: operationId }, select: { id: true } });
    if (!op) throw new NotFoundException('Bulk operation not found.');
    const where: Prisma.BulkOperationItemWhereInput = { operationId };
    if (query.status) where.status = query.status as BulkOperationItemStatus;
    const take = Math.min(500, query.pageSize ?? 100);
    return this.prisma.bulkOperationItem.findMany({ where, orderBy: { rowNumber: 'asc' }, take });
  }

  async create(dto: CreateBulkOperationDto, adminId: string) {
    if (dto.idempotencyKey) {
      const existing = await this.prisma.bulkOperation.findUnique({ where: { idempotencyKey: dto.idempotencyKey } });
      if (existing) throw new ConflictException('A bulk operation with this idempotency key already exists.');
    }

    return this.audit.runWithAudit(
      (tx) => tx.bulkOperation.create({
        data: {
          type: dto.type,
          dryRun: dto.dryRun ?? true,
          createdById: adminId,
          sourceFileName: dto.sourceFileName ?? null,
          parameters: dto.parameters ? JSON.parse(dto.parameters) : null,
          idempotencyKey: dto.idempotencyKey ?? null,
          status: BulkOperationStatus.PENDING,
        },
      }),
      (r) => ({ adminId, action: 'CREATE_BULK_OPERATION', targetType: 'PROPERTY', targetId: r.id, details: { type: r.type, dryRun: r.dryRun } }),
    );
  }

  /** Cancels a pending or dry-run-complete operation before it executes. */
  async cancel(id: string, adminId: string) {
    const op = await this.prisma.bulkOperation.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!op) throw new NotFoundException('Bulk operation not found.');
    const cancellable: BulkOperationStatus[] = [BulkOperationStatus.PENDING, BulkOperationStatus.DRY_RUN_COMPLETE];
    if (!cancellable.includes(op.status)) throw new BadRequestException(`Cannot cancel a ${op.status} operation.`);
    return this.audit.runWithAudit(
      (tx) => tx.bulkOperation.update({ where: { id }, data: { status: BulkOperationStatus.CANCELLED } }),
      (r) => ({ adminId, action: 'CANCEL_BULK_OPERATION', targetType: 'PROPERTY', targetId: r.id, details: { prevStatus: op.status } }),
    );
  }

  /** Summary counts per type and status. */
  async summary() {
    const [byStatus, byType] = await Promise.all([
      this.prisma.bulkOperation.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.bulkOperation.groupBy({ by: ['type'], _count: { _all: true } }),
    ]);
    return {
      byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])),
      byType: Object.fromEntries(byType.map((r) => [r.type, r._count._all])),
    };
  }
}
