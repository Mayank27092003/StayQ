import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { HostDashboardService } from './host-dashboard.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@Controller('host-dashboard')
@UseGuards(FirebaseAuthGuard)
export class HostDashboardController {
  constructor(private readonly hostDashboardService: HostDashboardService) {}

  @Get(':hostId')
  async getDashboardData(@Param('hostId') hostId: string) {
    return this.hostDashboardService.getDashboardData(hostId);
  }

  @Post('availability')
  async updateAvailability(@Body() body: { hostId: string; blockedDates: string[] }) {
    return this.hostDashboardService.updateAvailability(body.hostId, body.blockedDates);
  }
}
