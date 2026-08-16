import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { AdminHostsService } from './admin-hosts.service';
import { HostQueryDto, UpdateHostStatusDto, UpdateSuperhostDto } from './dto/host.dto';

@ApiTags('Admin / Hosts')
@ApiBearerAuth()
@Controller('admin/hosts')
@UseGuards(FirebaseAuthGuard, AdminGuard, AdminRolesGuard)
export class AdminHostsController {
  constructor(private readonly hosts: AdminHostsService) {}

  @Get()
  @ApiOperation({ summary: 'List hosts with listing counts and payout verification state' })
  list(@Query() query: HostQueryDto) {
    return this.hosts.list(query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Host counters by lifecycle status' })
  summary() {
    return this.hosts.summary();
  }

  @Get(':hostId')
  @ApiOperation({ summary: 'Host profile with aggregated performance metrics' })
  findOne(@Param('hostId', ParseUUIDPipe) hostId: string) {
    return this.hosts.findOne(hostId);
  }

  @Patch(':hostId/status')
  @AdminRoles(AdminRole.OPERATIONS, AdminRole.TRUST_SAFETY)
  @ApiOperation({ summary: 'Approve, suspend, or reset a host; suspension pauses live listings' })
  updateStatus(
    @Param('hostId', ParseUUIDPipe) hostId: string,
    @Body() dto: UpdateHostStatusDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.hosts.updateStatus(hostId, dto, adminId);
  }

  @Patch(':hostId/starhost')
  @AdminRoles(AdminRole.OPERATIONS, AdminRole.MARKETING)
  @ApiOperation({ summary: 'Grant or revoke starhost standing' })
  updateStarhost(
    @Param('hostId', ParseUUIDPipe) hostId: string,
    @Body() dto: UpdateSuperhostDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.hosts.updateSuperhost(hostId, dto, adminId);
  }

  @Patch(':hostId/superhost')
  @AdminRoles(AdminRole.OPERATIONS, AdminRole.MARKETING)
  @ApiOperation({ summary: 'Grant or revoke starhost standing (alias)' })
  updateSuperhost(
    @Param('hostId', ParseUUIDPipe) hostId: string,
    @Body() dto: UpdateSuperhostDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.hosts.updateSuperhost(hostId, dto, adminId);
  }

  @Patch(':hostId/notice')
  @AdminRoles(AdminRole.OPERATIONS, AdminRole.TRUST_SAFETY)
  @ApiOperation({ summary: 'Send a system notice to a low-performing host' })
  sendNotice(
    @Param('hostId', ParseUUIDPipe) hostId: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.hosts.sendImprovementNotice(hostId, adminId);
  }
}
