import { Controller, Get, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole, PropertyStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';

class AuditQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) limit?: number = 50;
  @IsOptional() @IsString() @MaxLength(80) action?: string;
  @IsOptional() @IsString() @MaxLength(80) targetType?: string;
  @IsOptional() @IsString() @MaxLength(100) targetId?: string;
  @IsOptional() @IsString() @MaxLength(100) adminId?: string;
}

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(FirebaseAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** Identity, role, and permissions for the signed-in admin account. */
  @Get('me')
  me(@CurrentUser() user: any) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      photoUrl: user.photoUrl,
      isAdmin: user.isAdmin,
      adminRole: user.adminRole,
    };
  }

  @Get('dashboard')
  getDashboard() { return this.adminService.getDashboardStats(); }

  @Get('users')
  getAllUsers() { return this.adminService.getAllUsers(); }

  @Put('users/:id/roles')
  updateUserRole(@Param('id') id: string, @Body('roles') roles: UserRole[]) {
    return this.adminService.updateUserRole(id, roles);
  }

  @Get('audit-logs')
  getAuditLogs(@Query() query: AuditQueryDto) {
    return this.adminService.getAuditLogs(query);
  }

  @Get('properties')
  getAllProperties() { return this.adminService.getAllProperties(); }

  @Put('properties/:id/status')
  updatePropertyStatus(@Param('id') id: string, @Body('status') status: PropertyStatus, @Req() req: any) {
    return this.adminService.updatePropertyStatus(id, status, req.user.id);
  }

  @Get('bookings')
  getAllBookings() { return this.adminService.getAllBookings(); }
}
