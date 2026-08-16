import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminGuard } from '../guards/admin.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminRoles } from '../decorators/admin-roles.decorator';
import { AdminBulkService } from './admin-bulk.service';
import { BulkItemQueryDto, BulkQueryDto, CreateBulkOperationDto } from './dto/bulk.dto';

@ApiTags('Admin / Bulk Operations')
@ApiBearerAuth()
@Controller('admin/bulk')
@UseGuards(FirebaseAuthGuard, AdminGuard, AdminRolesGuard)
export class AdminBulkController {
  constructor(private readonly svc: AdminBulkService) {}
  @Get() list(@Query() q: BulkQueryDto) { return this.svc.list(q); }
  @Get('summary') summary() { return this.svc.summary(); }
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(id); }
  @Get(':id/items') items(@Param('id', ParseUUIDPipe) id: string, @Query() q: BulkItemQueryDto) { return this.svc.items(id, q); }
  @Post() @AdminRoles(AdminRole.OPERATIONS) create(@Body() dto: CreateBulkOperationDto, @CurrentUser('id') id: string) { return this.svc.create(dto, id); }
  @Post(':id/cancel') @AdminRoles(AdminRole.OPERATIONS) cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') adminId: string) { return this.svc.cancel(id, adminId); }
}
