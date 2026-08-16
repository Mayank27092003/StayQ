import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  SupportMessage,
  SupportMessageAuthorType,
  SupportTicket,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditService } from '../audit/admin-audit.service';
import { buildPaginatedResult, PaginatedResult, toSkipTake } from '../dto/pagination.dto';
import {
  CreateSupportMessageDto,
  SupportTicketQueryDto,
  UpdateSupportTicketDto,
} from './dto/support.dto';

interface AdminSummary {
  id: string;
  displayName: string | null;
  email: string | null;
}

export interface SupportMessageResponse {
  id: string;
  authorType: SupportMessageAuthorType;
  authorId: string | null;
  authorName: string | null;
  body: string;
  attachments: string[];
  internal: boolean;
  createdAt: Date;
}

export interface SupportTicketResponse {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  category: string | null;
  assignedTo: string | null;
  assignee: AdminSummary | null;
  resolution: string | null;
  firstRespondedAt: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  /** Whole hours since the ticket was raised, for queue triage. */
  ageHours: number;
  messageCount: number;
  messages?: SupportMessageResponse[];
}

/** Transitions permitted from each state, so the queue statistics stay meaningful. */
const ALLOWED_TRANSITIONS: Record<SupportTicketStatus, SupportTicketStatus[]> = {
  [SupportTicketStatus.OPEN]: [
    SupportTicketStatus.IN_PROGRESS,
    SupportTicketStatus.RESOLVED,
    SupportTicketStatus.CLOSED,
  ],
  [SupportTicketStatus.IN_PROGRESS]: [
    SupportTicketStatus.OPEN,
    SupportTicketStatus.RESOLVED,
    SupportTicketStatus.CLOSED,
  ],
  [SupportTicketStatus.RESOLVED]: [SupportTicketStatus.CLOSED, SupportTicketStatus.IN_PROGRESS],
  [SupportTicketStatus.CLOSED]: [SupportTicketStatus.IN_PROGRESS],
};

const TERMINAL_STATUSES: SupportTicketStatus[] = [
  SupportTicketStatus.RESOLVED,
  SupportTicketStatus.CLOSED,
];

@Injectable()
export class AdminSupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  private toMessageResponse(message: SupportMessage): SupportMessageResponse {
    return {
      id: message.id,
      authorType: message.authorType,
      authorId: message.authorId,
      authorName: message.authorName,
      body: message.body,
      attachments: message.attachments,
      internal: message.internal,
      createdAt: message.createdAt,
    };
  }

  private toResponse(
    ticket: SupportTicket & { messages?: SupportMessage[]; _count?: { messages: number } },
    assignee: AdminSummary | null,
  ): SupportTicketResponse {
    const ageMs = Date.now() - ticket.createdAt.getTime();

    return {
      id: ticket.id,
      userId: ticket.userId,
      name: ticket.name,
      email: ticket.email,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      assignedTo: ticket.assignedTo,
      assignee,
      resolution: ticket.resolution,
      firstRespondedAt: ticket.firstRespondedAt,
      resolvedAt: ticket.resolvedAt,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      ageHours: Math.max(0, Math.round(ageMs / (60 * 60 * 1000))),
      messageCount: ticket._count?.messages ?? ticket.messages?.length ?? 0,
      messages: ticket.messages?.map((message) => this.toMessageResponse(message)),
    };
  }

  /**
   * `assignedTo` is a bare id column with no relation, so assignee identities
   * are resolved in one batched lookup rather than a join.
   */
  private async loadAssignees(ids: Array<string | null>): Promise<Map<string, AdminSummary>> {
    const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
    if (unique.length === 0) return new Map();

    const admins = await this.prisma.user.findMany({
      where: { id: { in: unique } },
      select: { id: true, displayName: true, email: true },
    });

    return new Map(admins.map((admin) => [admin.id, admin]));
  }

  async list(query: SupportTicketQueryDto): Promise<PaginatedResult<SupportTicketResponse>> {
    const { skip, take } = toSkipTake(query);

    const where: Prisma.SupportTicketWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.category) where.category = query.category;
    if (query.assignedTo) where.assignedTo = query.assignedTo;
    if (query.search) {
      where.OR = [
        { subject: { contains: query.search, mode: 'insensitive' } },
        { message: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
        include: { _count: { select: { messages: true } } },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    const assignees = await this.loadAssignees(tickets.map((t) => t.assignedTo));

    return buildPaginatedResult(
      tickets.map((ticket) =>
        this.toResponse(ticket, ticket.assignedTo ? assignees.get(ticket.assignedTo) ?? null : null),
      ),
      total,
      query,
    );
  }

  async findOne(id: string): Promise<SupportTicketResponse> {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ticket) throw new NotFoundException('Support ticket not found.');

    const assignees = await this.loadAssignees([ticket.assignedTo]);
    return this.toResponse(
      ticket,
      ticket.assignedTo ? assignees.get(ticket.assignedTo) ?? null : null,
    );
  }

  async update(
    id: string,
    dto: UpdateSupportTicketDto,
    adminId: string,
  ): Promise<SupportTicketResponse> {
    const existing = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Support ticket not found.');

    const data: Prisma.SupportTicketUpdateInput = {};

    if (dto.status !== undefined && dto.status !== existing.status) {
      if (!ALLOWED_TRANSITIONS[existing.status].includes(dto.status)) {
        throw new BadRequestException(
          `A ticket cannot move from ${existing.status} to ${dto.status}.`,
        );
      }
      data.status = dto.status;

      // Stamp the resolution time on first entry into a terminal state, and
      // clear it when the ticket is reopened.
      if (TERMINAL_STATUSES.includes(dto.status)) {
        data.resolvedAt = existing.resolvedAt ?? new Date();
      } else {
        data.resolvedAt = null;
      }
    }

    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.resolution !== undefined) data.resolution = dto.resolution;

    if (dto.assignedTo !== undefined) {
      if (dto.assignedTo === null) {
        data.assignedTo = null;
      } else {
        const assignee = await this.prisma.user.findUnique({
          where: { id: dto.assignedTo },
          select: { id: true, isAdmin: true },
        });
        if (!assignee) throw new NotFoundException('The assignee account was not found.');
        if (!assignee.isAdmin) {
          throw new BadRequestException('Tickets can only be assigned to an admin account.');
        }
        data.assignedTo = dto.assignedTo;
      }
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No changes were supplied.');
    }

    // Resolving must carry an explanation so the record stays useful later.
    const becomingTerminal =
      typeof data.status === 'string' && TERMINAL_STATUSES.includes(data.status);
    if (becomingTerminal && !dto.resolution && !existing.resolution) {
      throw new BadRequestException(
        'A resolution note is required when resolving or closing a ticket.',
      );
    }

    const updated = await this.audit.runWithAudit(
      (tx) =>
        tx.supportTicket.update({
          where: { id },
          data,
          include: { messages: { orderBy: { createdAt: 'asc' } } },
        }),
      (ticket) => ({
        adminId,
        action: 'UPDATE_SUPPORT_TICKET',
        targetType: 'SUPPORT_TICKET',
        targetId: ticket.id,
        details: {
          previousStatus: existing.status,
          newStatus: ticket.status,
          changedFields: Object.keys(data),
        },
      }),
    );

    const assignees = await this.loadAssignees([updated.assignedTo]);
    return this.toResponse(
      updated,
      updated.assignedTo ? assignees.get(updated.assignedTo) ?? null : null,
    );
  }

  /**
   * Appends an admin reply or internal note. A public reply also records the
   * first-response timestamp and moves an untouched ticket into progress, so
   * the queue reflects that work has started.
   */
  async addMessage(
    ticketId: string,
    dto: CreateSupportMessageDto,
    admin: { id: string; displayName: string | null; email: string | null },
  ): Promise<SupportMessageResponse> {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Support ticket not found.');

    const internal = dto.internal ?? false;

    const message = await this.audit.runWithAudit(
      async (tx) => {
        const created = await tx.supportMessage.create({
          data: {
            ticketId,
            authorType: SupportMessageAuthorType.ADMIN,
            authorId: admin.id,
            authorName: admin.displayName ?? admin.email,
            body: dto.body,
            attachments: dto.attachments ?? [],
            internal,
          },
        });

        const ticketUpdate: Prisma.SupportTicketUpdateInput = {};
        if (!internal && !ticket.firstRespondedAt) {
          ticketUpdate.firstRespondedAt = created.createdAt;
        }
        if (!internal && ticket.status === SupportTicketStatus.OPEN) {
          ticketUpdate.status = SupportTicketStatus.IN_PROGRESS;
        }
        if (Object.keys(ticketUpdate).length > 0) {
          await tx.supportTicket.update({ where: { id: ticketId }, data: ticketUpdate });
        }

        return created;
      },
      (created) => ({
        adminId: admin.id,
        action: internal ? 'ADD_SUPPORT_INTERNAL_NOTE' : 'REPLY_SUPPORT_TICKET',
        targetType: 'SUPPORT_TICKET',
        targetId: ticketId,
        details: { messageId: created.id, internal },
      }),
    );

    return this.toMessageResponse(message);
  }

  /** Queue counters and response times computed from stored timestamps. */
  async summary() {
    const [byStatus, byPriority, unassignedOpen, resolvedSample, respondedSample] =
      await Promise.all([
        this.prisma.supportTicket.groupBy({ by: ['status'], _count: { _all: true } }),
        this.prisma.supportTicket.groupBy({ by: ['priority'], _count: { _all: true } }),
        this.prisma.supportTicket.count({
          where: { assignedTo: null, status: SupportTicketStatus.OPEN },
        }),
        this.prisma.supportTicket.findMany({
          where: { resolvedAt: { not: null } },
          select: { createdAt: true, resolvedAt: true },
          orderBy: { resolvedAt: 'desc' },
          take: 200,
        }),
        this.prisma.supportTicket.findMany({
          where: { firstRespondedAt: { not: null } },
          select: { createdAt: true, firstRespondedAt: true },
          orderBy: { firstRespondedAt: 'desc' },
          take: 200,
        }),
      ]);

    const statusCounts = Object.fromEntries(
      Object.values(SupportTicketStatus).map((status) => [status, 0]),
    ) as Record<SupportTicketStatus, number>;
    for (const row of byStatus) statusCounts[row.status] = row._count._all;

    const priorityCounts = Object.fromEntries(
      Object.values(SupportTicketPriority).map((priority) => [priority, 0]),
    ) as Record<SupportTicketPriority, number>;
    for (const row of byPriority) priorityCounts[row.priority] = row._count._all;

    // Null rather than 0 when there is no sample, so the UI can state that the
    // figure is not available yet instead of implying instant resolution.
    const averageHours = (
      rows: Array<{ createdAt: Date; end: Date | null }>,
    ): number | null => {
      const usable = rows.filter((row) => row.end !== null);
      if (usable.length === 0) return null;
      const totalMs = usable.reduce(
        (sum, row) => sum + ((row.end as Date).getTime() - row.createdAt.getTime()),
        0,
      );
      return Math.round(totalMs / usable.length / (60 * 60 * 1000));
    };

    return {
      total: Object.values(statusCounts).reduce((sum, value) => sum + value, 0),
      byStatus: statusCounts,
      byPriority: priorityCounts,
      unassignedOpen,
      averageResolutionHours: averageHours(
        resolvedSample.map((t) => ({ createdAt: t.createdAt, end: t.resolvedAt })),
      ),
      averageFirstResponseHours: averageHours(
        respondedSample.map((t) => ({ createdAt: t.createdAt, end: t.firstRespondedAt })),
      ),
      resolutionSampleSize: resolvedSample.length,
      firstResponseSampleSize: respondedSample.length,
    };
  }
}
