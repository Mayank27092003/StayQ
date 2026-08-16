import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotificationType } from '@prisma/client';

@Controller('notifications')
@UseGuards(FirebaseAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getUserNotifications(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUserNotifications(userId);
  }

  @Patch(':id/read')
  markAsRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.notificationsService.markAsRead(userId, id);
  }

  @Post('device-token')
  saveDeviceToken(
    @CurrentUser('id') userId: string,
    @Body('token') token: string,
    @Body('platform') platform: string
  ) {
    return this.notificationsService.saveDeviceToken(userId, token, platform);
  }

  @Get('preferences')
  getPreferences(@CurrentUser('id') userId: string) {
    return this.notificationsService.getPreferences(userId);
  }

  @Patch('preferences')
  updatePreferences(
    @CurrentUser('id') userId: string,
    @Body() prefs: { pushEnabled?: boolean; emailEnabled?: boolean; smsEnabled?: boolean }
  ) {
    return this.notificationsService.updatePreferences(userId, prefs);
  }
  
  @Post('test-push')
  testPush(
    @CurrentUser('id') userId: string,
    @Body('title') title: string,
    @Body('body') body: string
  ) {
    return this.notificationsService.sendNotification(userId, NotificationType.SYSTEM, title, body);
  }
}
