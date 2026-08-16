import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { CalendarSyncService } from './calendar-sync.service';
import { DynamicPricingService } from './dynamic-pricing.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PropertiesController],
  providers: [PropertiesService, CalendarSyncService, DynamicPricingService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
