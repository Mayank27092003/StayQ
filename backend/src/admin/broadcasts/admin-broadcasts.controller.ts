import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminGuard } from '../guards/admin.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminRoles } from '../decorators/admin-roles.decorator';
import { AdminBroadcastsService } from './admin-broadcasts.service';
import { BroadcastQueryDto, CreateBroadcastDto } from './dto/broadcast.dto';

@ApiTags('Admin / Broadcasts')
@ApiBearerAuth()
@Controller('admin/broadcasts')
@UseGuards(FirebaseAuthGuard, AdminGuard, AdminRolesGuard)
export class AdminBroadcastsController {
  constructor(private readonly svc: AdminBroadcastsService) {}
  @Get() list(@Query() q: BroadcastQueryDto) { return this.svc.list(q); }
  @Post() @AdminRoles(AdminRole.MARKETING, AdminRole.OPERATIONS) create(@Body() dto: CreateBroadcastDto, @CurrentUser('id') id: string) { return this.svc.create(dto, id); }
  @Post(':id/send') @AdminRoles(AdminRole.MARKETING, AdminRole.OPERATIONS) send(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') adminId: string) { return this.svc.send(id, adminId); }
  @Delete(':id') @AdminRoles(AdminRole.MARKETING, AdminRole.OPERATIONS) delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') adminId: string) { return this.svc.delete(id, adminId); }
}
