import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { CalendarSyncService } from './calendar-sync.service';
import { DynamicPricingService } from './dynamic-pricing.service';
import { PropertiesBoostController } from './boost/properties-boost.controller';
import { PropertiesBoostService } from './boost/properties-boost.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PrismaModule, PaymentsModule],
  controllers: [PropertiesController, PropertiesBoostController],
  providers: [
    PropertiesService,
    CalendarSyncService,
    DynamicPricingService,
    PropertiesBoostService,
  ],
  exports: [PropertiesService, PropertiesBoostService],
})
export class PropertiesModule {}
