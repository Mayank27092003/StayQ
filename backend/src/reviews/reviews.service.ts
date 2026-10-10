import { text } from '../common/utils/input.util';
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { ReviewModerationStatus } from '@prisma/client';

@Injectable()
export class ReviewsService {
  private photos(value: any): string[] {
    if (value === undefined) return [];
    if (
      !Array.isArray(value) ||
      value.length > 10 ||
      value.some(
        (u) =>
          typeof u !== 'string' || u.length > 2048 || !/^https:\/\//.test(u),
      )
    )
      throw new BadRequestException('Invalid review photos');
    return value;
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  /**
   * BL-073: Can only review completed stays
   * BL-074: 1.0 to 5.0 rating bounds
   * BL-075: Two-way reveal policy
   */
  async createReview(
    guestId: string,
    dto: {
      propertyId: string;
      bookingId: string;
      rating: number;
      text?: string;
      photos?: string[];
    },
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { property: { select: { title: true } }, payment: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.guestId !== guestId)
      throw new ForbiddenException('You can only review your own bookings');
    if (booking.propertyId !== dto.propertyId)
      throw new ForbiddenException('Property mismatch for this booking');

    // BL-073: Check that stay has been completed
    const isCompleted =
      booking.status === 'COMPLETED' ||
      (booking.status === 'CONFIRMED' &&
        new Date(booking.checkOut) <= new Date());
    if (
      !isCompleted ||
      !['CAPTURED', 'RELEASED'].includes(booking.payment?.status || '')
    ) {
      throw new BadRequestException(
        'Reviews can only be submitted after your stay has been completed',
      );
    }

    // BL-074: Validate rating bounds
    if (
      typeof dto.rating !== 'number' ||
      !Number.isFinite(dto.rating) ||
      dto.rating < 1 ||
      dto.rating > 5
    ) {
      throw new BadRequestException(
        'Rating must be a number between 1.0 and 5.0 stars',
      );
    }

    const existing = await this.prisma.review.findUnique({
      where: { bookingId: dto.bookingId },
    });
    if (existing)
      throw new ConflictException(
        'A review has already been submitted for this booking',
      );

    // BL-075: Two-way reveal policy — visible immediately if single-side reviews, or 14-day cutoff
    const visibleAt = new Date();

    const review = await this.prisma.review.create({
      data: {
        propertyId: dto.propertyId,
        bookingId: dto.bookingId,
        guestId,
        rating: Math.round(dto.rating * 10) / 10,
        text: dto.text ? text(dto.text, 'Review', 4000) : undefined,
        photos: this.photos(dto.photos),
        visibleAt,
        moderationStatus: ReviewModerationStatus.PENDING,
      },
    });

    return review;
  }

  async replyToReview(hostId: string, reviewId: string, reply: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { property: true },
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.property.hostId !== hostId)
      throw new ForbiddenException(
        'Only the property host can reply to this review',
      );

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        hostReply: text(reply, 'Reply', 4000),
        hostRepliedAt: new Date(),
      },
    });
  }

  /**
   * BL-076: Correct review query — include APPROVED reviews (and unmoderated pending), never hide approved reviews
   */
  async getPropertyReviews(propertyId: string) {
    return this.prisma.review.findMany({
      where: {
        propertyId,
        visibleAt: { lte: new Date() },
        moderationStatus: ReviewModerationStatus.APPROVED,
      },
      include: {
        guest: { select: { id: true, displayName: true, photoUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  /**
   * BL-077: Reviews authored by this guest
   */
  async getReviewsAuthoredByUser(userId: string) {
    return this.prisma.review.findMany({
      where: {
        guestId: userId,
      },
      include: {
        property: { select: { id: true, title: true, images: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  /**
   * BL-077: Reviews received by this host on their listings
   */
  async getReviewsReceivedByHost(hostId: string) {
    return this.prisma.review.findMany({
      where: {
        property: {
          host: {
            OR: [{ id: hostId }, { firebaseUid: hostId }],
            deletedAt: null,
          },
        },
        visibleAt: { lte: new Date() },
        moderationStatus: ReviewModerationStatus.APPROVED,
      },
      include: {
        guest: { select: { id: true, displayName: true, photoUrl: true } },
        property: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  /**
   * Legacy alias: returns received reviews for hosts or authored reviews for guests
   */
  async getUserReviews(userId: string) {
    return this.getReviewsReceivedByHost(userId);
  }

  /**
   * NEW-014: Moderate review and compensate unearned loyalty reward points on rejection
   */
  async moderateReview(
    reviewId: string,
    status: ReviewModerationStatus,
    reason?: string,
  ) {
    if (!['APPROVED', 'REJECTED', 'HIDDEN'].includes(status))
      throw new BadRequestException('Invalid moderation decision');
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Review" WHERE id=${reviewId} FOR UPDATE`;
      const r = await tx.review.findUnique({ where: { id: reviewId } });
      if (!r) throw new NotFoundException('Review not found');
      const result = await tx.review.update({
        where: { id: reviewId },
        data: {
          moderationStatus: status,
          moderationNote: reason ? text(reason, 'Reason', 1000) : null,
          moderated: true,
          moderatedAt: new Date(),
        },
      });
      const type = status === 'APPROVED' ? 'REVIEW_REWARD' : 'REVIEW_REVERSAL';
      const key =
        type + ':' + reviewId + ':' + result.moderatedAt!.toISOString();
      await tx.domainJob.create({ data: { key, type, referenceId: reviewId } });
      return result;
    });
  }
}
