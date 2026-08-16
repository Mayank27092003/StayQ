import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ContentReport,
  ContentReportStatus,
  Prisma,
  ReviewModerationStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditService } from '../audit/admin-audit.service';
import { buildPaginatedResult, PaginatedResult, toSkipTake } from '../dto/pagination.dto';
import {
  ContentReportQueryDto,
  CreateContentReportDto,
  ModerateReviewDto,
  ResolveContentReportDto,
  ReviewModerationQueryDto,
} from './dto/moderation.dto';

/** Decisions that require a written justification. */
const DECISIONS_REQUIRING_NOTE: ReviewModerationStatus[] = [
  ReviewModerationStatus.HIDDEN,
  ReviewModerationStatus.REJECTED,
];

const REVIEW_INCLUDE = {
  guest: { select: { id: true, displayName: true, email: true, photoUrl: true } },
  property: { select: { id: true, title: true, city: true, hostId: true } },
} satisfies Prisma.ReviewInclude;

type ReviewWithRelations = Prisma.ReviewGetPayload<{ include: typeof REVIEW_INCLUDE }>;

@Injectable()
export class AdminModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  private toReviewResponse(review: ReviewWithRelations) {
    return {
      id: review.id,
      rating: review.rating,
      text: review.text,
      photos: review.photos,
      hostReply: review.hostReply,
      hostRepliedAt: review.hostRepliedAt,
      visibleAt: review.visibleAt,
      reported: review.reported,
      reportReason: review.reportReason,
      reportCount: review.reportCount,
      moderationStatus: review.moderationStatus,
      moderatedAt: review.moderatedAt,
      moderatedById: review.moderatedById,
      moderationNote: review.moderationNote,
      createdAt: review.createdAt,
      bookingId: review.bookingId,
      guest: review.guest,
      property: review.property,
    };
  }

  async listReviews(query: ReviewModerationQueryDto) {
    const { skip, take } = toSkipTake(query);

    const where: Prisma.ReviewWhereInput = {};
    if (query.moderationStatus) where.moderationStatus = query.moderationStatus;
    if (query.reported !== undefined) where.reported = query.reported;
    if (query.maxRating !== undefined) where.rating = { lte: query.maxRating };
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.search) {
      where.OR = [
        { text: { contains: query.search, mode: 'insensitive' } },
        { reportReason: { contains: query.search, mode: 'insensitive' } },
        { property: { title: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        // Reported items first, then newest, so the queue surfaces urgent work.
        orderBy: [{ reported: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
        include: REVIEW_INCLUDE,
      }),
      this.prisma.review.count({ where }),
    ]);

    return buildPaginatedResult(
      reviews.map((review) => this.toReviewResponse(review)),
      total,
      query,
    );
  }

  async findReview(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id }, include: REVIEW_INCLUDE });
    if (!review) throw new NotFoundException('Review not found.');
    return this.toReviewResponse(review);
  }

  /**
   * Records a moderation decision.
   *
   * `visibleAt` is the guest-facing visibility gate, so hiding or rejecting
   * clears it and approving restores it. The legacy `moderated` boolean is kept
   * in sync for any existing consumer that still reads it.
   */
  async moderateReview(id: string, dto: ModerateReviewDto, adminId: string) {
    const existing = await this.prisma.review.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Review not found.');

    if (DECISIONS_REQUIRING_NOTE.includes(dto.moderationStatus) && !dto.note) {
      throw new BadRequestException(
        `A note is required when setting a review to ${dto.moderationStatus}.`,
      );
    }

    const hides = DECISIONS_REQUIRING_NOTE.includes(dto.moderationStatus);
    const now = new Date();

    const data: Prisma.ReviewUpdateInput = {
      moderationStatus: dto.moderationStatus,
      moderatedAt: now,
      moderatedById: adminId,
      moderated: dto.moderationStatus !== ReviewModerationStatus.PENDING,
      visibleAt: hides ? null : existing.visibleAt ?? now,
    };

    if (dto.note !== undefined) data.moderationNote = dto.note;
    if (dto.clearReport) {
      data.reported = false;
      data.reportReason = null;
    }

    const updated = await this.audit.runWithAudit(
      (tx) => tx.review.update({ where: { id }, data, include: REVIEW_INCLUDE }),
      (review) => ({
        adminId,
        action: 'MODERATE_REVIEW',
        targetType: 'REVIEW',
        targetId: review.id,
        details: {
          previousStatus: existing.moderationStatus,
          newStatus: review.moderationStatus,
          reportCleared: dto.clearReport ?? false,
          note: dto.note ?? null,
        },
      }),
    );

    return this.toReviewResponse(updated);
  }

  /**
   * Permanently removes a review. Deletion is limited to rejected reviews so an
   * unexamined item cannot be destroyed before a decision is recorded.
   */
  async deleteReview(id: string, adminId: string) {
    const existing = await this.prisma.review.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Review not found.');

    if (existing.moderationStatus !== ReviewModerationStatus.REJECTED) {
      throw new BadRequestException(
        'Only a review already marked REJECTED can be deleted. Record that decision first so the removal is auditable.',
      );
    }

    await this.audit.runWithAudit(
      (tx) => tx.review.delete({ where: { id } }),
      (review) => ({
        adminId,
        action: 'DELETE_REVIEW',
        targetType: 'REVIEW',
        targetId: review.id,
        details: {
          propertyId: review.propertyId,
          rating: review.rating,
          moderationNote: review.moderationNote,
        },
      }),
    );

    return { id, deleted: true as const };
  }

  async reviewQueueSummary() {
    const [byStatus, reported, unmoderated] = await Promise.all([
      this.prisma.review.groupBy({ by: ['moderationStatus'], _count: { _all: true } }),
      this.prisma.review.count({ where: { reported: true } }),
      this.prisma.review.count({ where: { moderationStatus: ReviewModerationStatus.PENDING } }),
    ]);

    const counts = Object.fromEntries(
      Object.values(ReviewModerationStatus).map((status) => [status, 0]),
    ) as Record<ReviewModerationStatus, number>;
    for (const row of byStatus) counts[row.moderationStatus] = row._count._all;

    return {
      total: Object.values(counts).reduce((sum, value) => sum + value, 0),
      byModerationStatus: counts,
      reported,
      awaitingDecision: unmoderated,
    };
  }

  // --------------------------------------------------------------------------
  // Content reports
  // --------------------------------------------------------------------------

  /**
   * Resolves the reported entity's headline text so the queue is reviewable
   * without a second request per row. Reports use targetType/targetId rather
   * than foreign keys, so each type is fetched in its own batched query.
   */
  private async loadReportTargets(reports: ContentReport[]) {
    const idsByType = new Map<string, string[]>();
    for (const report of reports) {
      const list = idsByType.get(report.targetType) ?? [];
      list.push(report.targetId);
      idsByType.set(report.targetType, list);
    }

    const labels = new Map<string, { label: string | null; exists: boolean }>();
    const key = (type: string, id: string) => `${type}:${id}`;

    const propertyIds = idsByType.get('PROPERTY') ?? [];
    const imageIds = idsByType.get('PROPERTY_IMAGE') ?? [];
    const reviewIds = idsByType.get('REVIEW') ?? [];
    const messageIds = idsByType.get('MESSAGE') ?? [];
    const userIds = idsByType.get('USER_PROFILE') ?? [];

    const [properties, images, reviews, messages, users] = await Promise.all([
      propertyIds.length
        ? this.prisma.property.findMany({
            where: { id: { in: propertyIds } },
            select: { id: true, title: true },
          })
        : [],
      imageIds.length
        ? this.prisma.propertyImage.findMany({
            where: { id: { in: imageIds } },
            select: { id: true, url: true },
          })
        : [],
      reviewIds.length
        ? this.prisma.review.findMany({
            where: { id: { in: reviewIds } },
            select: { id: true, text: true },
          })
        : [],
      messageIds.length
        ? this.prisma.message.findMany({
            where: { id: { in: messageIds } },
            select: { id: true, text: true },
          })
        : [],
      userIds.length
        ? this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, displayName: true, email: true },
          })
        : [],
    ]);

    for (const row of properties) labels.set(key('PROPERTY', row.id), { label: row.title, exists: true });
    for (const row of images) labels.set(key('PROPERTY_IMAGE', row.id), { label: row.url, exists: true });
    for (const row of reviews) labels.set(key('REVIEW', row.id), { label: row.text, exists: true });
    for (const row of messages) labels.set(key('MESSAGE', row.id), { label: row.text, exists: true });
    for (const row of users) {
      labels.set(key('USER_PROFILE', row.id), {
        label: row.displayName ?? row.email,
        exists: true,
      });
    }

    return labels;
  }

  private async loadUserSummaries(ids: Array<string | null>) {
    const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
    if (unique.length === 0) return new Map<string, { id: string; displayName: string | null; email: string | null }>();

    const users = await this.prisma.user.findMany({
      where: { id: { in: unique } },
      select: { id: true, displayName: true, email: true },
    });

    return new Map(users.map((user) => [user.id, user]));
  }

  async listReports(query: ContentReportQueryDto): Promise<PaginatedResult<unknown>> {
    const { skip, take } = toSkipTake(query);

    const where: Prisma.ContentReportWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.targetType) where.targetType = query.targetType;
    if (query.reason) where.reason = query.reason;
    if (query.search) {
      where.OR = [
        { description: { contains: query.search, mode: 'insensitive' } },
        { targetId: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [reports, total] = await Promise.all([
      this.prisma.contentReport.findMany({
        where,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.contentReport.count({ where }),
    ]);

    const [targets, users] = await Promise.all([
      this.loadReportTargets(reports),
      this.loadUserSummaries(reports.flatMap((r) => [r.reportedById, r.reviewedById])),
    ]);

    const data = reports.map((report) => {
      const target = targets.get(`${report.targetType}:${report.targetId}`);

      return {
        id: report.id,
        targetType: report.targetType,
        targetId: report.targetId,
        // Null when the underlying entity has since been removed; the report
        // itself is retained for the audit trail.
        targetLabel: target?.label ?? null,
        targetExists: target?.exists ?? false,
        reason: report.reason,
        description: report.description,
        status: report.status,
        reportedBy: report.reportedById ? users.get(report.reportedById) ?? null : null,
        reviewedBy: report.reviewedById ? users.get(report.reviewedById) ?? null : null,
        reviewedAt: report.reviewedAt,
        resolutionNote: report.resolutionNote,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      };
    });

    return buildPaginatedResult(data, total, query);
  }

  /**
   * Creates a report from the admin side (a proactive sweep). Increments the
   * counter on the reported review so the moderation queue reflects volume.
   */
  async createReport(dto: CreateContentReportDto, adminId: string) {
    const created = await this.audit.runWithAudit(
      async (tx) => {
        const report = await tx.contentReport.create({
          data: {
            targetType: dto.targetType,
            targetId: dto.targetId,
            reason: dto.reason,
            description: dto.description ?? null,
            reportedById: adminId,
          },
        });

        if (dto.targetType === 'REVIEW') {
          // updateMany avoids failing the whole transaction when the review id
          // does not resolve; the report is still recorded.
          await tx.review.updateMany({
            where: { id: dto.targetId },
            data: {
              reported: true,
              reportReason: dto.description ?? dto.reason,
              reportCount: { increment: 1 },
            },
          });
        }

        return report;
      },
      (report) => ({
        adminId,
        action: 'CREATE_CONTENT_REPORT',
        targetType: 'REVIEW',
        targetId: report.targetId,
        details: { reportId: report.id, reason: report.reason, targetType: report.targetType },
      }),
    );

    return created;
  }

  async resolveReport(id: string, dto: ResolveContentReportDto, adminId: string) {
    const existing = await this.prisma.contentReport.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Report not found.');

    if (
      (dto.status === ContentReportStatus.ACTIONED ||
        dto.status === ContentReportStatus.DISMISSED) &&
      !dto.resolutionNote
    ) {
      throw new BadRequestException(
        'A resolution note is required when actioning or dismissing a report.',
      );
    }

    const terminal =
      dto.status === ContentReportStatus.ACTIONED || dto.status === ContentReportStatus.DISMISSED;

    const updated = await this.audit.runWithAudit(
      (tx) =>
        tx.contentReport.update({
          where: { id },
          data: {
            status: dto.status,
            resolutionNote: dto.resolutionNote ?? existing.resolutionNote,
            reviewedById: adminId,
            reviewedAt: terminal ? new Date() : existing.reviewedAt,
          },
        }),
      (report) => ({
        adminId,
        action: 'RESOLVE_CONTENT_REPORT',
        targetType: 'REVIEW',
        targetId: report.targetId,
        details: {
          reportId: report.id,
          previousStatus: existing.status,
          newStatus: report.status,
        },
      }),
    );

    return updated;
  }

  async reportSummary() {
    const [byStatus, byTargetType, byReason] = await Promise.all([
      this.prisma.contentReport.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.contentReport.groupBy({ by: ['targetType'], _count: { _all: true } }),
      this.prisma.contentReport.groupBy({ by: ['reason'], _count: { _all: true } }),
    ]);

    return {
      total: byStatus.reduce((sum, row) => sum + row._count._all, 0),
      byStatus: Object.fromEntries(byStatus.map((row) => [row.status, row._count._all])),
      byTargetType: Object.fromEntries(byTargetType.map((row) => [row.targetType, row._count._all])),
      byReason: Object.fromEntries(byReason.map((row) => [row.reason, row._count._all])),
    };
  }

  // ---- Host Applications --------------------------------------------------

  async getHostApplications() {
    // Find users who are NOT hosts yet, but have properties in PENDING_REVIEW
    const users = await this.prisma.user.findMany({
      where: {
        roles: {
          hasSome: ['GUEST'] // Basic check, we'll refine below
        },
        properties: {
          some: {
            status: 'PENDING_REVIEW'
          }
        }
      },
      include: {
        payoutAccount: true, // Includes KYC Docs (govIdType, govIdDocUrl, etc.)
        properties: {
          where: { status: 'PENDING_REVIEW' },
          take: 1, // Just get the first one for the application view
          include: {
            images: true, // Property Photos
            roomTypes: true
          }
        }
      }
    });

    // Filter out users who are already hosts
    return users.filter(u => !u.roles.includes('HOST')).map(u => ({
      userId: u.id,
      displayName: u.displayName,
      email: u.email,
      phone: u.phone,
      photoUrl: u.photoUrl,
      payoutAccount: u.payoutAccount,
      property: u.properties[0]
    }));
  }

  async approveHostApplication(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { properties: { where: { status: 'PENDING_REVIEW' } } } });
    if (!user) throw new NotFoundException('User not found');
    
    return this.prisma.$transaction(async (tx) => {
      // 1. Make user a HOST
      const updatedRoles = [...new Set([...user.roles, 'HOST' as any])];
      await tx.user.update({
        where: { id: userId },
        data: { roles: updatedRoles }
      });

      // 2. Approve all pending properties
      for (const prop of user.properties) {
        await tx.property.update({
          where: { id: prop.id },
          data: { status: 'ACTIVE' }
        });
      }

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'APPROVE_HOST_APP',
          targetType: 'USER',
          targetId: userId,
          details: { approvedProperties: user.properties.length },
        },
      });
      return { success: true };
    });
  }

  async rejectHostApplication(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { properties: { where: { status: 'PENDING_REVIEW' } } } });
    if (!user) throw new NotFoundException('User not found');
    
    return this.prisma.$transaction(async (tx) => {
      // Reject properties
      for (const prop of user.properties) {
        await tx.property.update({
          where: { id: prop.id },
          data: { status: 'REJECTED' }
        });
      }

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'REJECT_HOST_APP',
          targetType: 'USER',
          targetId: userId,
          details: { rejectedProperties: user.properties.length },
        },
      });
      return { success: true };
    });
  }
}
