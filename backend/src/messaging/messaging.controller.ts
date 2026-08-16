import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('messaging')
@UseGuards(FirebaseAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('conversations')
  getConversations(@CurrentUser('id') userId: string) {
    return this.messagingService.getUserConversations(userId);
  }

  @Get('conversations/:id')
  getConversation(@CurrentUser('id') userId: string, @Param('id') conversationId: string) {
    return this.messagingService.getConversation(userId, conversationId);
  }

  @Post('conversations')
  createConversation(
    @CurrentUser('id') userId: string,
    @Body('hostId') hostId: string,
    @Body('propertyId') propertyId?: string,
    @Body('bookingId') bookingId?: string
  ) {
    return this.messagingService.createConversation(userId, hostId, propertyId, bookingId);
  }
}
