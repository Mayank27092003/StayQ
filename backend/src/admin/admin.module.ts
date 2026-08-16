import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { AdminAuditService } from './audit/admin-audit.service';

import { AdminPromotionsController } from './promotions/admin-promotions.controller';
import { AdminPromotionsService } from './promotions/admin-promotions.service';

import { AdminSupportController } from './support/admin-support.controller';
import { AdminSupportService } from './support/admin-support.service';

import { AdminModerationController } from './moderation/admin-moderation.controller';
import { AdminModerationService } from './moderation/admin-moderation.service';
import { HostApplicationsController } from './moderation/host-applications.controller';

import { AdminHostsController } from './hosts/admin-hosts.controller';
import { AdminHostsService } from './hosts/admin-hosts.service';
import { TestAdminHostsController } from './hosts/test-hosts.controller';

import { AdminAnalyticsController } from './analytics/admin-analytics.controller';
import { AdminAnalyticsService } from './analytics/admin-analytics.service';

import { AdminUsersController } from './admin-users/admin-users.controller';
import { AdminUsersService } from './admin-users/admin-users.service';

import { AdminBookingsController } from './bookings/admin-bookings.controller';
import { AdminBookingsService } from './bookings/admin-bookings.service';
import { RefundGatewayService } from './bookings/refund-gateway.service';

import { AdminCatalogController } from './catalog/admin-catalog.controller';
import { AdminCatalogService } from './catalog/admin-catalog.service';

import { AdminFeaturedController } from './featured/admin-featured.controller';
import { AdminFeaturedService } from './featured/admin-featured.service';

import { AdminSettingsController } from './settings/admin-settings.controller';
import { AdminSettingsService } from './settings/admin-settings.service';

import { AdminBroadcastsController } from './broadcasts/admin-broadcasts.controller';
import { AdminBroadcastsService } from './broadcasts/admin-broadcasts.service';

import { AdminBulkController } from './bulk/admin-bulk.controller';
import { AdminBulkService } from './bulk/admin-bulk.service';

import { AdminReportsController } from './reports/admin-reports.controller';
import { AdminReportsService } from './reports/admin-reports.service';

import { AdminQubeController } from './qube/admin-qube.controller';
import { AdminQubeService } from './qube/admin-qube.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [
    AdminController,
    AdminPromotionsController,
    AdminSupportController,
    AdminModerationController,
    HostApplicationsController,
    AdminHostsController,
    TestAdminHostsController,
    AdminAnalyticsController,
    AdminUsersController,
    AdminBookingsController,
    AdminCatalogController,
    AdminFeaturedController,
    AdminSettingsController,
    AdminBroadcastsController,
    AdminBulkController,
    AdminReportsController,
    AdminQubeController,
  ],
  providers: [
    AdminService,
    AdminAuditService,
    AdminPromotionsService,
    AdminSupportService,
    AdminModerationService,
    AdminHostsService,
    AdminAnalyticsService,
    AdminUsersService,
    AdminBookingsService,
    RefundGatewayService,
    AdminCatalogService,
    AdminFeaturedService,
    AdminSettingsService,
    AdminBroadcastsService,
    AdminBulkService,
    AdminReportsService,
    AdminQubeService,
  ],
})
export class AdminModule {}
