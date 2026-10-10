import { assertPublishable } from '../../common/publication.util';
import { decryptSensitive } from '../../common/utils/encryption.util';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContentReport,
  ContentReportStatus,
  Prisma,
  ReviewModerationStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditService } from '../audit/admin-audit.service';
import {
  buildPaginatedResult,
  PaginatedResult,
  toSkipTake,
} from '../dto/pagination.dto';
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
  guest: {
    select: { id: true, displayName: true, email: true, photoUrl: true },
  },
  property: { select: { id: true, title: true, city: true, hostId: true } },
} satisfies Prisma.ReviewInclude;

type ReviewWithRelations = Prisma.ReviewGetPayload<{
  include: typeof REVIEW_INCLUDE;
}>;

import { EmailService } from '../../notifications/email.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class AdminModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
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
        {
          property: { title: { contains: query.search, mode: 'insensitive' } },
        },
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
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: REVIEW_INCLUDE,
    });
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
      visibleAt: hides ? null : (existing.visibleAt ?? now),
    };

    if (dto.note !== undefined) data.moderationNote = dto.note;
    if (dto.clearReport) {
      data.reported = false;
      data.reportReason = null;
    }

    const updated = await this.audit.runWithAudit(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Review" WHERE id=${id} FOR UPDATE`;
        const result = await tx.review.update({
          where: { id },
          data,
          include: REVIEW_INCLUDE,
        });
        const type =
          dto.moderationStatus === 'APPROVED'
            ? 'REVIEW_REWARD'
            : 'REVIEW_REVERSAL';
        await tx.domainJob.create({
          data: {
            key: type + ':' + id + ':' + now.toISOString(),
            type,
            referenceId: id,
          },
        });
        return result;
      },
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
    return this.audit.runWithAudit(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Review" WHERE id=${id} FOR UPDATE`;
        const r = await tx.review.findUnique({ where: { id } });
        if (!r) throw new NotFoundException('Review not found');
        if (r.moderationStatus !== 'REJECTED')
          throw new BadRequestException('Reject the review before removing it');
        return {
          id,
          removedFromPublic: true,
          retainedForRewardReconciliation: true,
        };
      },
      () => ({
        adminId,
        action: 'RETAIN_REJECTED_REVIEW',
        targetType: 'REVIEW',
        targetId: id,
      }),
    );
  }

  async reviewQueueSummary() {
    const [byStatus, reported, unmoderated] = await Promise.all([
      this.prisma.review.groupBy({
        by: ['moderationStatus'],
        _count: { _all: true },
      }),
      this.prisma.review.count({ where: { reported: true } }),
      this.prisma.review.count({
        where: { moderationStatus: ReviewModerationStatus.PENDING },
      }),
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

    for (const row of properties)
      labels.set(key('PROPERTY', row.id), { label: row.title, exists: true });
    for (const row of images)
      labels.set(key('PROPERTY_IMAGE', row.id), {
        label: row.url,
        exists: true,
      });
    for (const row of reviews)
      labels.set(key('REVIEW', row.id), { label: row.text, exists: true });
    for (const row of messages)
      labels.set(key('MESSAGE', row.id), { label: row.text, exists: true });
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
    if (unique.length === 0)
      return new Map<
        string,
        { id: string; displayName: string | null; email: string | null }
      >();

    const users = await this.prisma.user.findMany({
      where: { id: { in: unique } },
      select: { id: true, displayName: true, email: true },
    });

    return new Map(users.map((user) => [user.id, user]));
  }

  async listReports(
    query: ContentReportQueryDto,
  ): Promise<PaginatedResult<unknown>> {
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
      this.loadUserSummaries(
        reports.flatMap((r) => [r.reportedById, r.reviewedById]),
      ),
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
        reportedBy: report.reportedById
          ? (users.get(report.reportedById) ?? null)
          : null,
        reviewedBy: report.reviewedById
          ? (users.get(report.reviewedById) ?? null)
          : null,
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
        details: {
          reportId: report.id,
          reason: report.reason,
          targetType: report.targetType,
        },
      }),
    );

    return created;
  }

  async resolveReport(
    id: string,
    dto: ResolveContentReportDto,
    adminId: string,
  ) {
    const existing = await this.prisma.contentReport.findUnique({
      where: { id },
    });
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
      dto.status === ContentReportStatus.ACTIONED ||
      dto.status === ContentReportStatus.DISMISSED;

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
      this.prisma.contentReport.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.contentReport.groupBy({
        by: ['targetType'],
        _count: { _all: true },
      }),
      this.prisma.contentReport.groupBy({
        by: ['reason'],
        _count: { _all: true },
      }),
    ]);

    return {
      total: byStatus.reduce((sum, row) => sum + row._count._all, 0),
      byStatus: Object.fromEntries(
        byStatus.map((row) => [row.status, row._count._all]),
      ),
      byTargetType: Object.fromEntries(
        byTargetType.map((row) => [row.targetType, row._count._all]),
      ),
      byReason: Object.fromEntries(
        byReason.map((row) => [row.reason, row._count._all]),
      ),
    };
  }

  // ---- Host Applications --------------------------------------------------

  async getHostApplications() {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          {
            properties: {
              some: {
                status: { in: ['PENDING_REVIEW', 'DRAFT'] as any },
              },
            },
          },
          {
            isHostVerified: false,
            properties: {
              some: {},
            },
          },
        ],
      },
      include: {
        payoutAccount: true,
        properties: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            images: true,
            roomTypes: true,
          },
        },
      },
    });

    return users
      .map((u) => {
        let cleanGovId = u.payoutAccount?.govIdNumber || '';
        if (cleanGovId.startsWith('enc:v1:')) {
          try {
            cleanGovId = decryptSensitive(cleanGovId);
          } catch {
            cleanGovId = 'Verified (KYC)';
          }
        }
        return {
          userId: u.id,
          displayName: u.displayName || u.email || 'Host Applicant',
          email: u.email,
          phone: u.phone,
          photoUrl: u.photoUrl,
          payoutAccount: u.payoutAccount
            ? {
                ...u.payoutAccount,
                govIdNumber: cleanGovId,
              }
            : null,
          property: u.properties[0],
        };
      })
      .filter((app) => !!app.property);
  }

  async approveHostApplication(userId: string, adminId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Property" WHERE "hostId"=${userId} ORDER BY id FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM "User" WHERE id=${userId} FOR UPDATE`;
      const u = await tx.user.findUnique({
        where: { id: userId },
        include: { payoutAccount: true },
      });
      if (!u || u.deletedAt)
        throw new NotFoundException('Active host not found');
      if (u.hostStatus === 'SUSPENDED')
        throw new BadRequestException(
          'Resolve the suspension before approving an application',
        );

      // Auto-verify payout account upon admin approval
      if (u.payoutAccount && !u.payoutAccount.verified) {
        await tx.hostPayoutAccount.update({
          where: { id: u.payoutAccount.id },
          data: {
            verified: true,
            verifiedAt: new Date(),
            verifiedBy: adminId || 'admin',
          },
        });
        u.payoutAccount.verified = true;
      }

      // Auto-verify email upon admin approval
      if (!u.emailVerified && u.email) {
        await tx.user.update({
          where: { id: userId },
          data: { emailVerified: true },
        });
        u.emailVerified = true;
      }

      const props = await tx.property.findMany({
        where: { hostId: userId, status: 'PENDING_REVIEW' },
        include: { images: true },
      });
      if (!props.length)
        throw new BadRequestException('No submitted property awaits review');
      for (const p of props) {
        await tx.$queryRaw`SELECT id FROM "Property" WHERE id=${p.id} FOR UPDATE`;
        const fresh = await tx.property.findUnique({
          where: { id: p.id },
          include: { images: true },
        });
        if (!fresh || fresh.status !== 'PENDING_REVIEW') continue;
        assertPublishable({
          ...fresh,
          propertyDocsVerified: true,
          host: {
            ...u,
            isHostVerified: true,
            hostStatus: 'APPROVED',
            payoutAccount: { ...u.payoutAccount, verified: true },
            emailVerified: true,
          },
        });
        await tx.property.update({
          where: { id: p.id },
          data: {
            status: 'ACTIVE',
            propertyDocsVerified: true,
            propertyDocsVerifiedAt: new Date(),
          },
        });

      }
      await tx.user.update({
        where: { id: userId },
        data: {
          roles: [...new Set([...u.roles, 'HOST' as const])],
          isHostVerified: true,
          hostVerifiedAt: new Date(),
          hostStatus: 'APPROVED',
        },
      });
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'APPROVE_HOST_APPLICATION',
          targetType: 'HOST',
          targetId: userId,
          details: { approvedProperties: props.length },
        },
      });
      return { success: true, approvedPropertiesCount: props.length, user: u, properties: props };
    });

    // Await delivery outside transaction so Cloud Run socket remains active:
    if (result.user?.email && Array.isArray(result.properties)) {
      for (const p of result.properties) {
        try {
          await Promise.allSettled([
            this.emailService.sendHostApprovedEmail({
              to: result.user.email,
              hostName: result.user.displayName || 'Host',
              propertyTitle: p.title,
            }),
            this.emailService.sendPropertyLiveEmail({
              to: result.user.email,
              hostName: result.user.displayName || 'Host',
              propertyTitle: p.title,
              propertyCode: p.id.slice(0, 8).toUpperCase(),
            }),
            this.notificationsService.sendNotification(
              userId,
              NotificationType.BOOKING_CONFIRMED,
              '🎉 Listing Approved & Live on StayQ!',
              `Congratulations! Your listing "${p.title}" has been approved and is now live on StayQ. You can now host guests and start receiving reservations!`,
              {
                propertyId: p.id,
                eventKey: `approved:${p.id}`,
              },
            ),
          ]);
        } catch (e: any) {
          // Log but don't fail
        }
      }
    }
    return { success: true, approvedPropertiesCount: result.approvedPropertiesCount };
  }

  async rejectHostApplication(userId: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.property.updateMany({
        where: { hostId: userId, status: 'PENDING_REVIEW' },
        data: { status: 'REJECTED' },
      });
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'REJECT_HOST_APPLICATION',
          targetType: 'HOST',
          targetId: userId,
          details: { rejectedProperties: result.count },
        },
      });
      const u = await tx.user.findUnique({ where: { id: userId } });
      if (u?.email) {
        this.emailService
          .sendEmail(
            u.email,
            'StayQ Host Application Update',
            '<div style="font-family:sans-serif;padding:24px"><h2 style="color:#DC2626">Application Needs Update</h2><p>Hi ' + (u.displayName || 'Host') + ', your property application requires additional document verification. Please check your host dashboard to update details.</p></div>',
            true,
          )
          .catch(() => {});
      }
      this.notificationsService
        .sendNotification(
          userId,
          NotificationType.SYSTEM,
          'Host Application Needs Update',
          'Your host application requires document verification updates before approval.',
          { eventKey: `rejected:${userId}` },
        )
        .catch(() => {});
      return { success: true, rejectedProperties: result.count };
    });
  }
}
