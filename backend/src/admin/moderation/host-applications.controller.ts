import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminModerationService } from './admin-moderation.service';

@ApiTags('Host Applications')
@Controller('admin/moderation/test-host-applications')
export class HostApplicationsController {
  constructor(private readonly moderation: AdminModerationService) {}

  @Get()
  @ApiOperation({ summary: 'List first-time host applications (Unprotected for demo)' })
  listHostApplications() {
    return this.moderation.getHostApplications();
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a host application (Unprotected for demo)' })
  approveHostApplication(@Param('id', ParseUUIDPipe) userId: string) {
    // Pass the userId as adminId to satisfy the foreign key constraint during demo
    return this.moderation.approveHostApplication(userId, userId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a host application (Unprotected for demo)' })
  rejectHostApplication(@Param('id', ParseUUIDPipe) userId: string) {
    return this.moderation.rejectHostApplication(userId, userId);
  }
}
