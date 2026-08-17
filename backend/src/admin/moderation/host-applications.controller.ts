import { Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminModerationService } from './admin-moderation.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Host Applications')
@ApiBearerAuth()
@Controller('admin/moderation/host-applications')
@UseGuards(FirebaseAuthGuard, AdminGuard)
export class HostApplicationsController {
  constructor(private readonly moderation: AdminModerationService) {}

  @Get()
  @ApiOperation({ summary: 'List first-time host applications' })
  listHostApplications() {
    return this.moderation.getHostApplications();
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a host application' })
  approveHostApplication(
    @Param('id', ParseUUIDPipe) userId: string,
    @CurrentUser() adminUser: any,
  ) {
    return this.moderation.approveHostApplication(userId, adminUser?.id || userId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a host application' })
  rejectHostApplication(
    @Param('id', ParseUUIDPipe) userId: string,
    @CurrentUser() adminUser: any,
  ) {
    return this.moderation.rejectHostApplication(userId, adminUser?.id || userId);
  }
}
