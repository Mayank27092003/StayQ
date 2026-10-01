import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { CommissionService, CommissionSettingsDto } from './commission.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';

@Controller()
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  @Get('admin/commission-settings')
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  getAdminSettings() {
    return this.commissionService.getSettings();
  }

  @Post('admin/commission-settings')
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  updateAdminSettings(@Body() dto: Partial<CommissionSettingsDto>) {
    return this.commissionService.updateSettings(dto);
  }

  @Get('commission/settings')
  getPublicSettings() {
    return this.commissionService.getSettings();
  }
}
