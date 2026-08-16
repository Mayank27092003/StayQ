import { Controller, Get, Post, Body } from '@nestjs/common';
import { CommissionService, CommissionSettingsDto } from './commission.service';

@Controller()
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  @Get('admin/commission-settings')
  getAdminSettings() {
    return this.commissionService.getSettings();
  }

  @Post('admin/commission-settings')
  updateAdminSettings(@Body() dto: Partial<CommissionSettingsDto>) {
    return this.commissionService.updateSettings(dto);
  }

  @Get('commission/settings')
  getPublicSettings() {
    return this.commissionService.getSettings();
  }
}
