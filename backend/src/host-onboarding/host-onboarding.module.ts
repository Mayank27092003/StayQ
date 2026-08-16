import { Module } from '@nestjs/common';
import { HostOnboardingController } from './host-onboarding.controller';
import { HostOnboardingService } from './host-onboarding.service';
import { HostLeadsController } from './host-leads.controller';
import { HostLeadsService } from './host-leads.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HostOnboardingController, HostLeadsController],
  providers: [HostOnboardingService, HostLeadsService],
  exports: [HostLeadsService],
})
export class HostOnboardingModule {}
