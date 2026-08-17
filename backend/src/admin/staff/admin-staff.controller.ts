import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminStaffService } from './admin-staff.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { AdminGuard } from '../guards/admin.guard';

@Controller('admin/staff')
export class AdminStaffController {
  constructor(private readonly staffService: AdminStaffService) {}

  /**
   * Get all staff members
   * GET /api/v1/admin/staff
   */
  @Get()
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  async getAllStaff() {
    return this.staffService.getAllStaff();
  }

  /**
   * Create a new employee / staff member
   * POST /api/v1/admin/staff
   */
  @Post()
  @UseGuards(FirebaseAuthGuard, AdminGuard)
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
    },
  ) {
    return this.staffService.createStaff(body);
  }

  /**
   * Update staff permissions, department, or status
   * PATCH /api/v1/admin/staff/:id
   */
  @Patch(':id')
  @UseGuards(FirebaseAuthGuard, AdminGuard)
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
    },
  ) {
    return this.staffService.updateStaff(id, body);
  }

  /**
   * Reset staff password
   * POST /api/v1/admin/staff/:id/reset-password
   */
  @Post(':id/reset-password')
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  async resetPassword(@Param('id') id: string) {
    return this.staffService.resetStaffPassword(id);
  }

  /**
   * Revoke / Delete staff member
   * DELETE /api/v1/admin/staff/:id
   */
  @Delete(':id')
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  async deleteStaff(@Param('id') id: string) {
    return this.staffService.deleteStaff(id);
  }

  /**
   * Staff login authentication
   * POST /api/v1/admin/staff/login
   */
  @Post('login')
  async staffLogin(@Body() body: { identifier: string; password: string }) {
    return this.staffService.staffLogin(body.identifier, body.password);
  }
}
