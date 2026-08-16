import { Controller, Post, Body, Param, Get, UseGuards } from '@nestjs/common';
import { LeasesService } from './leases.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@Controller('leases')
@UseGuards(FirebaseAuthGuard)
export class LeasesController {
  constructor(private readonly leasesService: LeasesService) {}

  @Post()
  createLease(@Body() createLeaseDto: any) {
    return this.leasesService.createLease(createLeaseDto);
  }

  @Post(':id/generate-pdf')
  generatePdf(@Param('id') id: string) {
    return this.leasesService.generateLeasePdf(id);
  }

  @Post('automation/rent')
  processMonthlyRent() {
    return this.leasesService.processMonthlyRent();
  }
}
