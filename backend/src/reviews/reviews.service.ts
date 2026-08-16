import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(guestId: string, dto: { propertyId: string, bookingId: string, rating: number, text?: string, photos?: string[] }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId }
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.guestId !== guestId) throw new ForbiddenException('Not your booking');
    if (booking.propertyId !== dto.propertyId) throw new ForbiddenException('Property mismatch');

    const existing = await this.prisma.review.findUnique({
      where: { bookingId: dto.bookingId }
    });

    if (existing) throw new ConflictException('Review already exists for this booking');

    const visibleAt = new Date(); // Simplified for now. Should handle 14-day or both reviewed logic.

    return this.prisma.review.create({
      data: {
        propertyId: dto.propertyId,
        bookingId: dto.bookingId,
        guestId,
        rating: dto.rating,
        text: dto.text,
        photos: dto.photos || [],
        visibleAt
      }
    });
  }

  async replyToReview(hostId: string, reviewId: string, reply: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { property: true }
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.property.hostId !== hostId) throw new ForbiddenException('Not your property');

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        hostReply: reply,
        hostRepliedAt: new Date()
      }
    });
  }

  async getPropertyReviews(propertyId: string) {
    return this.prisma.review.findMany({
      where: {
        propertyId,
        visibleAt: { lte: new Date() },
        moderated: false
      },
      include: {
        guest: { select: { id: true, displayName: true, photoUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getUserReviews(userId: string) {
    return this.prisma.review.findMany({
      where: {
        property: { hostId: userId },
        visibleAt: { lte: new Date() },
        moderated: false
      },
      include: {
        guest: { select: { id: true, displayName: true, photoUrl: true } },
        property: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
