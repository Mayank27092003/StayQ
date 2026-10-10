import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { HostLeadsService, HostLeadDto } from './host-leads.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';

@Controller('host-leads')
export class HostLeadsController {
  constructor(private readonly leadsService: HostLeadsService) {}

  @Post()
  createLead(@CurrentUser() user: any, @Body() data: HostLeadDto) {
    return this.leadsService.createLead(data, user);
  }

  @Get()
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  getAllLeads() {
    return this.leadsService.getAllLeads();
  }

  @Patch(':id/status')
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: HostLeadDto['status'],
  ) {
    return this.leadsService.updateLeadStatus(id, status);
  }
}
