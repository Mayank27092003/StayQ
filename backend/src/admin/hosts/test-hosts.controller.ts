import { Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminHostsService } from './admin-hosts.service';
import { HostQueryDto, UpdateHostStatusDto, UpdateSuperhostDto } from './dto/host.dto';

@ApiTags('Test Admin / Hosts')
@Controller('admin/test-hosts')
export class TestAdminHostsController {
  constructor(private readonly hosts: AdminHostsService) {}

  @Get()
  @ApiOperation({ summary: 'List hosts with listing counts and payout verification state (Unprotected)' })
  list(@Query() query: HostQueryDto) {
    return this.hosts.list(query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Host counters by lifecycle status (Unprotected)' })
  summary() {
    return this.hosts.summary();
  }

  @Get(':hostId')
  @ApiOperation({ summary: 'Host profile with aggregated performance metrics (Unprotected)' })
  findOne(@Param('hostId', ParseUUIDPipe) hostId: string) {
    return this.hosts.findOne(hostId);
  }
}
