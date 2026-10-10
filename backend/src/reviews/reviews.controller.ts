import { Public } from '../common/decorators/public.decorator';
import { AdminGuard } from '../admin/guards/admin.guard';
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
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
    @Body()
    dto: {
      propertyId: string;
      bookingId: string;
      rating: number;
      text?: string;
      photos?: string[];
    },
  ) {
    return this.reviewsService.createReview(userId, dto);
  }

  @Patch(':id/reply')
  @UseGuards(FirebaseAuthGuard)
  replyToReview(
    @CurrentUser('id') hostId: string,
    @Param('id') reviewId: string,
    @Body('reply') reply: string,
  ) {
    return this.reviewsService.replyToReview(hostId, reviewId, reply);
  }

  @Public()
  @Get('property/:propertyId')
  getPropertyReviews(@Param('propertyId') propertyId: string) {
    return this.reviewsService.getPropertyReviews(propertyId);
  }

  @Public()
  @Get('user/:userId')
  getUserReviews(@Param('userId') userId: string) {
    return this.reviewsService.getUserReviews(userId);
  }

  @Get('authored/me')
  @UseGuards(FirebaseAuthGuard)
  getMyAuthoredReviews(@CurrentUser('id') userId: string) {
    return this.reviewsService.getReviewsAuthoredByUser(userId);
  }

  @Public()
  @Get('received/host/:hostId')
  getHostReceivedReviews(@Param('hostId') hostId: string) {
    return this.reviewsService.getReviewsReceivedByHost(hostId);
  }

  @Patch(':id/moderate')
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  moderateReview(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { status: any; reason?: string },
  ) {
    return this.reviewsService.moderateReview(id, body.status, body.reason);
  }
}
