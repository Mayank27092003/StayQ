import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminModerationService } from './admin-moderation.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { AdminGuard } from '../guards/admin.guard';

@ApiTags('Host Applications')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, AdminGuard)
@Controller([
  'admin/moderation/host-applications',
  'admin/moderation/test-host-applications',
])
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
    if (!adminUser?.id) {
      throw new UnauthorizedException('Admin identification required');
    }
    return this.moderation.approveHostApplication(userId, adminUser.id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a host application' })
  rejectHostApplication(
    @Param('id', ParseUUIDPipe) userId: string,
    @CurrentUser() adminUser: any,
  ) {
    if (!adminUser?.id) {
      throw new UnauthorizedException('Admin identification required');
    }
    return this.moderation.rejectHostApplication(userId, adminUser.id);
  }
}
