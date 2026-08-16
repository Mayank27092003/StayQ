import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminGuard } from '../guards/admin.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminRoles } from '../decorators/admin-roles.decorator';
import { AdminModerationService } from './admin-moderation.service';
import {
  ContentReportQueryDto,
  CreateContentReportDto,
  ModerateReviewDto,
  ResolveContentReportDto,
  ReviewModerationQueryDto,
} from './dto/moderation.dto';

@ApiTags('Admin / Moderation')
@ApiBearerAuth()
@Controller('admin/moderation')
@UseGuards(FirebaseAuthGuard, AdminGuard, AdminRolesGuard)
export class AdminModerationController {
  constructor(private readonly moderation: AdminModerationService) {}

  // ---- Reviews -------------------------------------------------------------

  @Get('reviews')
  @ApiOperation({ summary: 'List reviews for moderation, reported items first' })
  listReviews(@Query() query: ReviewModerationQueryDto) {
    return this.moderation.listReviews(query);
  }

  @Get('reviews/summary')
  @ApiOperation({ summary: 'Review moderation queue counters' })
  reviewSummary() {
    return this.moderation.reviewQueueSummary();
  }

  @Get('reviews/:id')
  @ApiOperation({ summary: 'Get one review with guest and property context' })
  findReview(@Param('id', ParseUUIDPipe) id: string) {
    return this.moderation.findReview(id);
  }

  @Patch('reviews/:id')
  @AdminRoles(AdminRole.TRUST_SAFETY, AdminRole.OPERATIONS)
  @ApiOperation({ summary: 'Record a moderation decision on a review' })
  moderateReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModerateReviewDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.moderation.moderateReview(id, dto, adminId);
  }

  @Delete('reviews/:id')
  @AdminRoles(AdminRole.TRUST_SAFETY)
  @ApiOperation({ summary: 'Delete a review that has already been rejected' })
  deleteReview(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') adminId: string) {
    return this.moderation.deleteReview(id, adminId);
  }

  // ---- Reports -------------------------------------------------------------

  @Get('reports')
  @ApiOperation({ summary: 'List content reports with resolved target labels' })
  listReports(@Query() query: ContentReportQueryDto) {
    return this.moderation.listReports(query);
  }

  @Get('reports/summary')
  @ApiOperation({ summary: 'Content report counters by status, target, and reason' })
  reportSummary() {
    return this.moderation.reportSummary();
  }

  @Post('reports')
  @AdminRoles(AdminRole.TRUST_SAFETY, AdminRole.OPERATIONS)
  @ApiOperation({ summary: 'Raise a content report during a proactive sweep' })
  createReport(@Body() dto: CreateContentReportDto, @CurrentUser('id') adminId: string) {
    return this.moderation.createReport(dto, adminId);
  }

  @Patch('reports/:id')
  @AdminRoles(AdminRole.TRUST_SAFETY, AdminRole.OPERATIONS)
  @ApiOperation({ summary: 'Action or dismiss a content report' })
  resolveReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveContentReportDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.moderation.resolveReport(id, dto, adminId);
  }

  // ---- Host Applications ---------------------------------------------------

  @Get('host-applications')
  @ApiOperation({ summary: 'List first-time host applications' })
  listHostApplications() {
    return this.moderation.getHostApplications();
  }

  @Post('host-applications/:id/approve')
  @AdminRoles(AdminRole.TRUST_SAFETY, AdminRole.OPERATIONS)
  @ApiOperation({ summary: 'Approve a host application and their first property' })
  approveHostApplication(
    @Param('id', ParseUUIDPipe) userId: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.moderation.approveHostApplication(userId, adminId);
  }

  @Post('host-applications/:id/reject')
  @AdminRoles(AdminRole.TRUST_SAFETY, AdminRole.OPERATIONS)
  @ApiOperation({ summary: 'Reject a host application' })
  rejectHostApplication(
    @Param('id', ParseUUIDPipe) userId: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.moderation.rejectHostApplication(userId, adminId);
  }
}
