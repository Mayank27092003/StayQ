import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { Response } from 'express';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminGuard } from '../guards/admin.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminRoles } from '../decorators/admin-roles.decorator';
import { AdminReportsService } from './admin-reports.service';
import { CreateReportDefinitionDto, ReportDefinitionQueryDto, RunReportNowDto } from './dto/reports.dto';

@ApiTags('Admin / Reports')
@ApiBearerAuth()
@Controller('admin/reports')
@UseGuards(FirebaseAuthGuard, AdminGuard, AdminRolesGuard)
export class AdminReportsController {
  constructor(private readonly svc: AdminReportsService) {}
  @Get('definitions') listDefinitions(@Query() q: ReportDefinitionQueryDto) { return this.svc.listDefinitions(q); }
  @Post('definitions') @AdminRoles(AdminRole.FINANCE, AdminRole.OPERATIONS) create(@Body() dto: CreateReportDefinitionDto, @CurrentUser('id') id: string) { return this.svc.createDefinition(dto, id); }
  @Delete('definitions/:id') @AdminRoles(AdminRole.FINANCE, AdminRole.OPERATIONS) deleteDefinition(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') adminId: string) { return this.svc.deleteDefinition(id, adminId); }
  @Get('definitions/:id/runs') listRuns(@Param('id', ParseUUIDPipe) id: string) { return this.svc.listRuns(id); }
  @Post('definitions/:id/run') @AdminRoles(AdminRole.FINANCE, AdminRole.OPERATIONS) run(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RunReportNowDto, @CurrentUser('id') adminId: string) { return this.svc.runNow(id, dto, adminId); }
  @Get('runs/:id/download') async download(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const { content, contentType, fileName } = await this.svc.getRunContent(id);
    res.setHeader('Content-Type', contentType ?? 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName ?? 'report.txt'}"`);
    res.send(content);
  }
}
