import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, Prisma, ReportFormat, ReportKind, ReportRunStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditService } from '../audit/admin-audit.service';
import { buildPaginatedResult, toSkipTake } from '../dto/pagination.dto';
import { CreateReportDefinitionDto, ReportDefinitionQueryDto, RunReportNowDto } from './dto/reports.dto';
import { decimalToNumber } from '../common/serialization';

@Injectable()
export class AdminReportsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AdminAuditService) {}

  async listDefinitions(query: ReportDefinitionQueryDto) {
    const { skip, take } = toSkipTake(query);
    const where: Prisma.ReportDefinitionWhereInput = {};
    if (query.kind) where.kind = query.kind;
    if (query.active !== undefined) where.active = query.active;
    const [rows, total] = await Promise.all([
      this.prisma.reportDefinition.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take, include: { _count: { select: { runs: true } } } }),
      this.prisma.reportDefinition.count({ where }),
    ]);
    return buildPaginatedResult(rows, total, query);
  }

  async createDefinition(dto: CreateReportDefinitionDto, adminId: string) {
    return this.audit.runWithAudit(
      (tx) => tx.reportDefinition.create({
        data: { name: dto.name, description: dto.description ?? null, kind: dto.kind, format: dto.format, frequency: dto.frequency, parameters: dto.parameters ? JSON.parse(dto.parameters) : null, recipients: dto.recipients ?? [], active: true, createdById: adminId },
      }),
      (r) => ({ adminId, action: 'CREATE_REPORT_DEFINITION', targetType: 'PROPERTY', targetId: r.id, details: { kind: r.kind } }),
    );
  }

  async deleteDefinition(id: string, adminId: string) {
    const def = await this.prisma.reportDefinition.findUnique({ where: { id } });
    if (!def) throw new NotFoundException('Report definition not found.');
    await this.audit.runWithAudit(
      (tx) => tx.reportDefinition.delete({ where: { id } }),
      (r) => ({ adminId, action: 'DELETE_REPORT_DEFINITION', targetType: 'PROPERTY', targetId: r.id, details: {} }),
    );
    return { id, deleted: true as const };
  }

  async listRuns(definitionId: string) {
    const def = await this.prisma.reportDefinition.findUnique({ where: { id: definitionId } });
    if (!def) throw new NotFoundException('Report definition not found.');
    return this.prisma.reportRun.findMany({ where: { definitionId }, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  async runNow(definitionId: string, dto: RunReportNowDto, adminId: string) {
    const def = await this.prisma.reportDefinition.findUnique({ where: { id: definitionId } });
    if (!def) throw new NotFoundException('Report definition not found.');
    if (!def.active) throw new BadRequestException('This report definition is disabled.');

    const periodStart = dto.periodStart ? new Date(dto.periodStart) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const periodEnd = dto.periodEnd ? new Date(dto.periodEnd) : new Date();

    // Mark queued, generate inline, mark succeeded.
    const run = await this.prisma.reportRun.create({
      data: { definitionId, status: ReportRunStatus.QUEUED, periodStart, periodEnd, triggeredById: adminId, startedAt: new Date() },
    });

    try {
      const { content, rowCount, fileName } = await this.generateContent(def.kind, def.format, periodStart, periodEnd, def.parameters as Record<string, unknown> | null);
      return await this.prisma.reportRun.update({
        where: { id: run.id },
        data: { status: ReportRunStatus.SUCCEEDED, rowCount, content, contentType: def.format === ReportFormat.CSV ? 'text/csv' : 'application/json', fileName, completedAt: new Date() },
      });
    } catch (err) {
      return this.prisma.reportRun.update({
        where: { id: run.id },
        data: { status: ReportRunStatus.FAILED, errorMessage: err instanceof Error ? err.message : 'Unknown error', completedAt: new Date() },
      });
    }
  }

  async getRunContent(runId: string) {
    const run = await this.prisma.reportRun.findUnique({ where: { id: runId } });
    if (!run) throw new NotFoundException('Report run not found.');
    if (!run.content) throw new BadRequestException('This run has no generated content.');
    return { content: run.content, contentType: run.contentType, fileName: run.fileName };
  }

  private async generateContent(kind: ReportKind, format: ReportFormat, from: Date, to: Date, params: Record<string, unknown> | null): Promise<{ content: string; rowCount: number; fileName: string }> {
    const filter = { createdAt: { gte: from, lte: to } };
    let rows: unknown[] = [];

    switch (kind) {
      case ReportKind.BOOKINGS:
        rows = (await this.prisma.booking.findMany({ where: filter, select: { id: true, confirmationCode: true, status: true, checkIn: true, checkOut: true, totalAmount: true, createdAt: true, guest: { select: { email: true } }, property: { select: { title: true, city: true } } }, orderBy: { createdAt: 'desc' } }))
          .map((r) => ({ ...r, totalAmount: decimalToNumber(r.totalAmount), guestEmail: r.guest?.email, propertyTitle: r.property?.title, city: r.property?.city, guest: undefined, property: undefined }));
        break;
      case ReportKind.REVENUE:
        rows = (await this.prisma.payment.findMany({ where: filter, select: { id: true, status: true, amount: true, platformCommission: true, hostPayout: true, currency: true, capturedAt: true, createdAt: true } }))
          .map((r) => ({ ...r, amount: decimalToNumber(r.amount), platformCommission: decimalToNumber(r.platformCommission), hostPayout: decimalToNumber(r.hostPayout) }));
        break;
      case ReportKind.USERS:
        rows = await this.prisma.user.findMany({ where: filter, select: { id: true, email: true, displayName: true, roles: true, isAdmin: true, createdAt: true }, orderBy: { createdAt: 'desc' } });
        break;
      case ReportKind.PROPERTIES:
        rows = await this.prisma.property.findMany({ where: filter, select: { id: true, title: true, city: true, status: true, category: true, type: true, pricePerNight: true, createdAt: true, host: { select: { email: true } } }, orderBy: { createdAt: 'desc' } });
        break;
      case ReportKind.PROMOTION_REDEMPTIONS:
        rows = (await this.prisma.booking.findMany({ where: { ...filter, couponCode: { not: null }, status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] } }, select: { id: true, couponCode: true, couponDiscount: true, totalAmount: true, createdAt: true } }))
          .map((r) => ({ ...r, couponDiscount: decimalToNumber(r.couponDiscount), totalAmount: decimalToNumber(r.totalAmount) }));
        break;
      case ReportKind.SUPPORT_TICKETS:
        rows = await this.prisma.supportTicket.findMany({ where: filter, select: { id: true, subject: true, status: true, priority: true, createdAt: true, resolvedAt: true }, orderBy: { createdAt: 'desc' } });
        break;
      default:
        rows = [];
    }

    const date = new Date().toISOString().slice(0, 10);
    if (format === ReportFormat.CSV) {
      const content = rows.length === 0 ? '' : [Object.keys(rows[0] as object).join(','), ...rows.map((row) => Object.values(row as object).map((v) => (v === null || v === undefined ? '' : String(v).includes(',') ? `"${v}"` : String(v))).join(','))].join('\n');
      return { content, rowCount: rows.length, fileName: `${kind.toLowerCase()}_${date}.csv` };
    }
    return { content: JSON.stringify(rows, null, 2), rowCount: rows.length, fileName: `${kind.toLowerCase()}_${date}.json` };
  }
}
