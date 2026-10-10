import { PropertiesModule } from '../properties/properties.module';
import { Module } from '@nestjs/common';
import { HostDashboardController } from './host-dashboard.controller';
import { HostDashboardService } from './host-dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, PropertiesModule],
  controllers: [HostDashboardController],
  providers: [HostDashboardService],
})
export class HostDashboardModule {}
