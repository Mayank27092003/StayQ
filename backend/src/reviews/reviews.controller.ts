import { Controller, Post, Body, Get, Param, UseGuards, Patch } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  createReview(
    @CurrentUser('id') userId: string,
    @Body() dto: { propertyId: string, bookingId: string, rating: number, text?: string, photos?: string[] }
  ) {
    return this.reviewsService.createReview(userId, dto);
  }

  @Patch(':id/reply')
  @UseGuards(FirebaseAuthGuard)
  replyToReview(
    @CurrentUser('id') hostId: string,
    @Param('id') reviewId: string,
    @Body('reply') reply: string
  ) {
    return this.reviewsService.replyToReview(hostId, reviewId, reply);
  }

  @Get('property/:propertyId')
  getPropertyReviews(@Param('propertyId') propertyId: string) {
    return this.reviewsService.getPropertyReviews(propertyId);
  }

  @Get('user/:userId')
  getUserReviews(@Param('userId') userId: string) {
    return this.reviewsService.getUserReviews(userId);
  }
}
