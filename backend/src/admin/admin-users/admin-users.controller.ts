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
import { AdminUsersService } from './admin-users.service';
import {
  AdminUserQueryDto,
  GrantAdminAccessDto,
  RevokeAdminAccessDto,
  UpdateAdminRoleDto,
} from './dto/admin-user.dto';

@ApiTags('Admin / Admin users')
@ApiBearerAuth()
@Controller('admin/admin-users')
@UseGuards(FirebaseAuthGuard, AdminGuard, AdminRolesGuard)
export class AdminUsersController {
  constructor(private readonly adminUsers: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'List admin accounts, or non-admin accounts when isAdmin=false' })
  list(@Query() query: AdminUserQueryDto) {
    return this.adminUsers.list(query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Admin counts by role' })
  summary() {
    return this.adminUsers.summary();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one admin account' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminUsers.findOne(id);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Recent audited actions performed by this admin' })
  activity(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminUsers.activity(id);
  }

  @Post(':id/access')
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Grant admin access to an account (SUPER_ADMIN only)' })
  grant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GrantAdminAccessDto,
    @CurrentUser('id') actingAdminId: string,
  ) {
    return this.adminUsers.grantAccess(id, dto, actingAdminId);
  }

  @Patch(':id/role')
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Change an admin role (SUPER_ADMIN only)' })
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminRoleDto,
    @CurrentUser('id') actingAdminId: string,
  ) {
    return this.adminUsers.updateRole(id, dto, actingAdminId);
  }

  @Delete(':id/access')
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Revoke admin access (SUPER_ADMIN only)' })
  revoke(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RevokeAdminAccessDto,
    @CurrentUser('id') actingAdminId: string,
  ) {
    return this.adminUsers.revokeAccess(id, dto, actingAdminId);
  }
}
