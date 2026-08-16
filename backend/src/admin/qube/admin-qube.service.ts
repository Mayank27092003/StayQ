import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditService } from '../audit/admin-audit.service';
import { buildPaginatedResult, toSkipTake } from '../dto/pagination.dto';
import { ConversationQueryDto, CreateKnowledgeDto, KnowledgeQueryDto, UpdateKnowledgeDto } from './dto/qube-admin.dto';

@Injectable()
export class AdminQubeService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AdminAuditService) {}

  async listConversations(query: ConversationQueryDto) {
    const { skip, take } = toSkipTake(query);
    const where: Prisma.QubeConversationWhereInput = {};
    if (query.userId) where.userId = query.userId;
    if (query.search) where.sessionLabel = { contains: query.search, mode: 'insensitive' };
    const [rows, total] = await Promise.all([
      this.prisma.qubeConversation.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.qubeConversation.count({ where }),
    ]);
    return buildPaginatedResult(rows, total, query);
  }

  async findConversation(id: string) {
    const conv = await this.prisma.qubeConversation.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: 'asc' } } } });
    if (!conv) throw new NotFoundException('Conversation not found.');
    return conv;
  }

  async listKnowledge(query: KnowledgeQueryDto) {
    const { skip, take } = toSkipTake(query);
    const where: Prisma.QubeKnowledgeEntryWhereInput = {};
    if (query.activeOnly) where.active = true;
    if (query.search) where.OR = [
      { topic: { contains: query.search, mode: 'insensitive' } },
      { content: { contains: query.search, mode: 'insensitive' } },
    ];
    const [rows, total] = await Promise.all([
      this.prisma.qubeKnowledgeEntry.findMany({ where, orderBy: [{ priority: 'desc' }, { topic: 'asc' }], skip, take }),
      this.prisma.qubeKnowledgeEntry.count({ where }),
    ]);
    return buildPaginatedResult(rows, total, query);
  }

  async createKnowledge(dto: CreateKnowledgeDto, adminId: string) {
    return this.audit.runWithAudit(
      (tx) => tx.qubeKnowledgeEntry.create({ data: { topic: dto.topic, content: dto.content, tags: dto.tags ?? [], priority: dto.priority ?? 0, active: dto.active ?? true, createdById: adminId, updatedById: adminId } }),
      (r) => ({ adminId, action: 'CREATE_QUBE_KNOWLEDGE', targetType: 'PROPERTY', targetId: r.id, details: { topic: r.topic } }),
    );
  }

  async updateKnowledge(id: string, dto: UpdateKnowledgeDto, adminId: string) {
    const existing = await this.prisma.qubeKnowledgeEntry.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Knowledge entry not found.');
    const data: Prisma.QubeKnowledgeEntryUpdateInput = { updatedById: adminId };
    if (dto.topic !== undefined) data.topic = dto.topic;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.active !== undefined) data.active = dto.active;
    return this.audit.runWithAudit(
      (tx) => tx.qubeKnowledgeEntry.update({ where: { id }, data }),
      (r) => ({ adminId, action: 'UPDATE_QUBE_KNOWLEDGE', targetType: 'PROPERTY', targetId: r.id, details: {} }),
    );
  }

  async deleteKnowledge(id: string, adminId: string) {
    const existing = await this.prisma.qubeKnowledgeEntry.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Knowledge entry not found.');
    await this.audit.runWithAudit(
      (tx) => tx.qubeKnowledgeEntry.delete({ where: { id } }),
      (r) => ({ adminId, action: 'DELETE_QUBE_KNOWLEDGE', targetType: 'PROPERTY', targetId: r.id, details: {} }),
    );
    return { id, deleted: true as const };
  }

  async telemetry() {
    const [totalConversations, totalMessages, helpfulRated, unhelpfulRated, knowledgeCount, activeKnowledge] = await Promise.all([
      this.prisma.qubeConversation.count(),
      this.prisma.qubeMessage.count(),
      this.prisma.qubeMessage.count({ where: { helpful: true } }),
      this.prisma.qubeMessage.count({ where: { helpful: false } }),
      this.prisma.qubeKnowledgeEntry.count(),
      this.prisma.qubeKnowledgeEntry.count({ where: { active: true } }),
    ]);
    const totalRated = helpfulRated + unhelpfulRated;
    return {
      conversations: totalConversations,
      messages: totalMessages,
      knowledgeEntries: { total: knowledgeCount, active: activeKnowledge },
      feedback: { helpful: helpfulRated, unhelpful: unhelpfulRated, total: totalRated, helpfulRate: totalRated === 0 ? null : Math.round((helpfulRated / totalRated) * 1000) / 10 },
    };
  }
}
