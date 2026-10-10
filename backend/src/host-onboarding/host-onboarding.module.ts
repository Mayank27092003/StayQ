import { PropertiesModule } from '../properties/properties.module';
import { Module } from '@nestjs/common';
import { HostOnboardingController } from './host-onboarding.controller';
import { HostOnboardingService } from './host-onboarding.service';
import { HostLeadsController } from './host-leads.controller';
import { HostLeadsService } from './host-leads.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, PropertiesModule, NotificationsModule],
  controllers: [HostOnboardingController, HostLeadsController],
  providers: [HostOnboardingService, HostLeadsService],
  exports: [HostLeadsService],
})
export class HostOnboardingModule {}

