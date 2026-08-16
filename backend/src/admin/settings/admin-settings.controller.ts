import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminGuard } from '../guards/admin.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminRoles } from '../decorators/admin-roles.decorator';
import { AdminSettingsService } from './admin-settings.service';
import { SettingQueryDto, UpsertSettingDto } from './dto/settings.dto';

@ApiTags('Admin / Settings')
@ApiBearerAuth()
@Controller('admin/settings')
@UseGuards(FirebaseAuthGuard, AdminGuard, AdminRolesGuard)
export class AdminSettingsController {
  constructor(private readonly settings: AdminSettingsService) {}

  @Get() list(@Query() q: SettingQueryDto) { return this.settings.list(q); }
  @Get('groups') groups() { return this.settings.groups(); }
  @Put() @AdminRoles(AdminRole.SUPER_ADMIN) upsert(@Body() dto: UpsertSettingDto, @CurrentUser('id') id: string) { return this.settings.upsert(dto, id); }
  @Delete(':id') @AdminRoles(AdminRole.SUPER_ADMIN) delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') adminId: string) { return this.settings.delete(id, adminId); }
}
