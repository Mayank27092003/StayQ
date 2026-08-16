import { Module } from '@nestjs/common';
import { HostDashboardController } from './host-dashboard.controller';
import { HostDashboardService } from './host-dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HostDashboardController],
  providers: [HostDashboardService],
})
export class HostDashboardModule {}
