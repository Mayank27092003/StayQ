import { Controller, Post, Body, Param, Get, UseGuards } from '@nestjs/common';
import { LeasesService } from './leases.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('leases')
@UseGuards(FirebaseAuthGuard)
export class LeasesController {
  constructor(private readonly leasesService: LeasesService) {}

  @Post()
  createLease(@CurrentUser() user: any, @Body() createLeaseDto: any) {
    return this.leasesService.createLease(createLeaseDto);
  }

  @Post(':id/generate-pdf')
  generatePdf(@CurrentUser() user: any, @Param('id') id: string) {
    return this.leasesService.generateLeasePdf(id, user);
  }

  @Post('automation/rent')
  @UseGuards(AdminGuard)
  processMonthlyRent() {
    return this.leasesService.processMonthlyRent();
  }
}
