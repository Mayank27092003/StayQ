import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AdminStaffService } from './admin-staff.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { AdminGuard } from '../guards/admin.guard';

@UseGuards(FirebaseAuthGuard, AdminGuard)
@Controller('admin/staff')
export class AdminStaffController {
  constructor(private readonly staffService: AdminStaffService) {}

  /**
   * Helper to extract client IP
   */
  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || 'Direct Gateway';
  }

  /**
   * Get all staff members with real-time presence
   * GET /api/v1/admin/staff
   */
  @Get()
  async getAllStaff() {
    return this.staffService.getAllStaff();
  }

  /**
   * Fetch recent staff activity audit logs
   * GET /api/v1/admin/staff/activities
   */
  @Get('activities')
  async getStaffActivities(
    @Query('staffId') staffId?: string,
    @Query('module') module?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
  ) {
    return this.staffService.getStaffActivities({ staffId, module, limit, skip });
  }

  /**
   * Create a new employee / staff member
   * POST /api/v1/admin/staff
   */
  @Post()
  async createStaff(
    @Body()
    body: {
      fullName: string;
      email: string;
      department: string;
      role?: string;
      allowedModules: string[];
      phoneNumber?: string;
      customPassword?: string;
      customStaffId?: string;
      adminStaffId?: string;
      adminStaffName?: string;
    },
  ) {
    return this.staffService.createStaff({
      ...body,
      createdById: body.adminStaffId,
      createdByName: body.adminStaffName,
    });
  }

  /**
   * Update staff permissions, department, or status
   * PATCH /api/v1/admin/staff/:id
   */
  @Patch(':id')
  async updateStaff(
    @Param('id') id: string,
    @Body()
    body: {
      fullName?: string;
      department?: string;
      role?: string;
      status?: string;
      allowedModules?: string[];
      phoneNumber?: string;
      newPassword?: string;
      adminStaffId?: string;
      adminStaffName?: string;
    },
  ) {
    return this.staffService.updateStaff(id, body);
  }

  /**
   * Reset staff password
   * POST /api/v1/admin/staff/:id/reset-password
   */
  @Post(':id/reset-password')
  async resetPassword(@Param('id') id: string) {
    return this.staffService.resetStaffPassword(id);
  }

  /**
   * Master Admin Force Logout — instantly kicks staff off system
   * POST /api/v1/admin/staff/:id/force-logout
   */
  @Post(':id/force-logout')
  async forceLogout(
    @Param('id') id: string,
    @Body() body?: { adminStaffId?: string; adminStaffName?: string },
  ) {
    return this.staffService.forceLogoutStaff(id, body?.adminStaffId, body?.adminStaffName);
  }

  /**
   * Revoke / Delete staff member
   * DELETE /api/v1/admin/staff/:id
   */
  @Delete(':id')
  async deleteStaff(@Param('id') id: string) {
    return this.staffService.deleteStaff(id);
  }

  /**
   * Staff login authentication
   * POST /api/v1/admin/staff/login
   */
  @Post('login')
  async staffLogin(
    @Body() body: { identifier: string; password: string },
    @Req() req: Request,
  ) {
    const ip = this.getClientIp(req);
    const ua = (req.headers['user-agent'] as string) || 'Web Gateway';
    return this.staffService.staffLogin(body.identifier, body.password, ip, ua);
  }

  /**
   * Staff heartbeat for live presence
   * POST /api/v1/admin/staff/heartbeat
   */
  @Post('heartbeat')
  async staffHeartbeat(
    @Body() body: { staffId: string },
    @Req() req: Request,
  ) {
    const ip = this.getClientIp(req);
    return this.staffService.staffHeartbeat(body.staffId, ip);
  }

  /**
   * Staff clean logout
   * POST /api/v1/admin/staff/logout
   */
  @Post('logout')
  async staffLogout(
    @Body() body: { staffId: string },
    @Req() req: Request,
  ) {
    const ip = this.getClientIp(req);
    return this.staffService.staffLogout(body.staffId, ip);
  }
}

