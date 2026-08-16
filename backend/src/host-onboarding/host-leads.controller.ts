import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { HostLeadsService, HostLeadDto } from './host-leads.service';

@Controller('host-leads')
export class HostLeadsController {
  constructor(private readonly leadsService: HostLeadsService) {}

  @Post()
  createLead(@Body() data: HostLeadDto) {
    return this.leadsService.createLead(data);
  }

  @Get()
  getAllLeads() {
    return this.leadsService.getAllLeads();
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: HostLeadDto['status']) {
    return this.leadsService.updateLeadStatus(id, status);
  }
}
