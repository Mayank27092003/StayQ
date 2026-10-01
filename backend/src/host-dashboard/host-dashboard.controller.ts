import { Controller, Get, Post, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { HostDashboardService } from './host-dashboard.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('host-dashboard')
@UseGuards(FirebaseAuthGuard)
export class HostDashboardController {
  constructor(private readonly hostDashboardService: HostDashboardService) {}

  @Get(':hostId')
  async getDashboardData(@CurrentUser() user: any, @Param('hostId') hostId: string) {
    if (user.id !== hostId && !user.isAdmin) {
      throw new ForbiddenException('Access denied to host dashboard');
    }
    return this.hostDashboardService.getDashboardData(hostId);
  }

  @Post('availability')
  async updateAvailability(@CurrentUser() user: any, @Body() body: { hostId: string; blockedDates: string[] }) {
    if (user.id !== body.hostId && !user.isAdmin) {
      throw new ForbiddenException('Access denied to host dashboard availability');
    }
    return this.hostDashboardService.updateAvailability(body.hostId, body.blockedDates);
  }
}
