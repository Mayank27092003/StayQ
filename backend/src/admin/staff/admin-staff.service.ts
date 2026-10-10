import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ServiceUnavailableException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../notifications/email.service';
import * as crypto from 'crypto';
import { text } from '../../common/utils/input.util';

@Injectable()
export class AdminStaffService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async onModuleInit() {
    /* Staff accounts are provisioned explicitly; no startup credentials or automatic mail. */
  }

  /**
   * Seed 3 initial staff accounts matching the user's operational structure:
   * 1. Bookings & Inventory Staff (SQ-EMP-1001)
   * 2. Accounts & Finance Staff (SQ-EMP-1002)
   * 3. Customer Support Staff (SQ-EMP-1003)
   */
  async seedInitialStaff() {
    throw new BadRequestException(
      'Automatic default-password provisioning is disabled',
    );
  }

  /**
   * List all staff members with live attendance calculation
   */
  async getAllStaff() {
    const now = Date.now();
    const staff = await this.prisma.adminStaff.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        staffId: true,
        fullName: true,
        email: true,
        department: true,
        role: true,
        status: true,
        allowedModules: true,
        phoneNumber: true,
        lastLoginAt: true,
        lastLogoutAt: true,
        lastActiveAt: true,
        isOnline: true,
        currentSessionIp: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Compute live attendance status based on heartbeat freshness
    const staffWithPresence = staff.map((s) => {
      let presenceStatus: 'ONLINE' | 'IDLE' | 'OFFLINE' = 'OFFLINE';
      if (s.isOnline && s.lastActiveAt) {
        const diffMs = now - new Date(s.lastActiveAt).getTime();
        if (diffMs < 2.5 * 60 * 1000) {
          presenceStatus = 'ONLINE';
        } else if (diffMs < 5 * 60 * 1000) {
          presenceStatus = 'IDLE';
        } else {
          presenceStatus = 'OFFLINE';
        }
      }

      return {
        ...s,
        presenceStatus,
      };
    });

    return {
      success: true,
      count: staffWithPresence.length,
      authenticationProvider: 'FIREBASE',
      accessManagedSeparately: true,
      staff: staffWithPresence,
    };
  }

  /**
   * Create a new employee / staff member with auto-generated credentials
   */
  async createStaff(dto: {
    fullName: string;
    email: string;
    department: string;
    role?: string;
    allowedModules: string[];
    phoneNumber?: string;
    customPassword?: string;
    customStaffId?: string;
    createdById?: string;
    createdByName?: string;
  }) {
    const existing = await this.prisma.adminStaff.findFirst({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (existing) {
      throw new BadRequestException(
        'A staff member with this email already exists.',
      );
    }

    // Generate unique Staff ID or use custom
    let staffId = dto.customStaffId?.trim().toUpperCase();
    if (!staffId) {
      staffId = 'SQ-EMP-' + crypto.randomBytes(6).toString('hex').toUpperCase();
    } else {
      const idExists = await this.prisma.adminStaff.findUnique({
        where: { staffId },
      });
      if (idExists) {
        throw new BadRequestException(
          `Staff ID ${staffId} is already assigned to another employee.`,
        );
      }
    }

    if (dto.customPassword !== undefined)
      throw new BadRequestException(
        'Passwords are managed by Firebase; omit customPassword',
      );
    const passwordHash = 'DISABLED:' + crypto.randomBytes(32).toString('hex');
    text(dto.fullName, 'Full name', 150);
    text(dto.email, 'Email', 254);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email.trim()))
      throw new BadRequestException('Invalid email');
    if (
      !Array.isArray(dto.allowedModules) ||
      dto.allowedModules.length > 30 ||
      dto.allowedModules.some((m) => typeof m !== 'string' || m.length > 60)
    )
      throw new BadRequestException('Invalid modules');

    const newStaff = await this.prisma.adminStaff.create({
      data: {
        staffId,
        fullName: dto.fullName.trim(),
        email: dto.email.trim().toLowerCase(),
        passwordHash,
        department: dto.department || 'Operations & Ground Ops',
        role: dto.role || 'STAFF',
        status: 'ACTIVE',
        allowedModules:
          dto.allowedModules && dto.allowedModules.length > 0
            ? dto.allowedModules
            : ['properties', 'bookings'],
        phoneNumber: dto.phoneNumber?.trim() || null,
        createdById: dto.createdById || null,
      },
    });

    // Log Activity
    await this.logActivity({
      staffId: dto.createdById || 'MASTER_ADMIN',
      staffName: dto.createdByName || 'Master Admin',
      email: 'hello@stayq.space',
      module: 'staff',
      action: 'CREATE_STAFF',
      description: `Created new staff member ${newStaff.staffId} (${newStaff.fullName}) with modules: ${newStaff.allowedModules.join(', ')}`,
      targetId: newStaff.id,
    });

    return {
      success: true,
      message:
        'Staff directory entry created. Assign access separately through a verified Firebase account.',
      staff: {
        id: newStaff.id,
        staffId: newStaff.staffId,
        fullName: newStaff.fullName,
        email: newStaff.email,
        department: newStaff.department,
        role: newStaff.role,
        status: newStaff.status,
        allowedModules: newStaff.allowedModules,
        phoneNumber: newStaff.phoneNumber,
        createdAt: newStaff.createdAt,
      },
      authenticationProvider: 'FIREBASE',
      accessManagedSeparately: true,
    };
  }

  /**
   * Update staff permissions or status
   */
  async updateStaff(
    id: string,
    dto: {
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
    const staff = await this.prisma.adminStaff.findUnique({ where: { id } });
    if (!staff) {
      throw new NotFoundException('Staff member not found.');
    }

    if (dto.newPassword !== undefined)
      throw new BadRequestException(
        'Passwords are managed by Firebase; omit newPassword',
      );
    if (
      dto.status !== undefined &&
      !['ACTIVE', 'SUSPENDED', 'INACTIVE'].includes(dto.status)
    )
      throw new BadRequestException('Invalid staff status');
    if (
      dto.allowedModules !== undefined &&
      (!Array.isArray(dto.allowedModules) ||
        dto.allowedModules.length > 30 ||
        dto.allowedModules.some((m) => typeof m !== 'string' || m.length > 60))
    )
      throw new BadRequestException('Invalid modules');
    for (const field of ['fullName', 'department', 'role'])
      if (dto[field] !== undefined) text(dto[field], field, 150);
    const updateData: any = {};
    if (dto.fullName) updateData.fullName = dto.fullName.trim();
    if (dto.department) updateData.department = dto.department;
    if (dto.role) updateData.role = dto.role;
    if (dto.status) updateData.status = dto.status;
    if (dto.allowedModules) updateData.allowedModules = dto.allowedModules;
    if (dto.phoneNumber !== undefined) updateData.phoneNumber = dto.phoneNumber;

    const updated = await this.prisma.adminStaff.update({
      where: { id },
      data: updateData,
    });

    // Log Activity
    await this.logActivity({
      staffId: dto.adminStaffId || 'MASTER_ADMIN',
      staffName: dto.adminStaffName || 'Master Admin',
      email: 'hello@stayq.space',
      module: 'staff',
      action: 'UPDATE_STAFF',
      description: `Updated permissions/profile for staff ${updated.staffId} (${updated.fullName}). Status: ${updated.status}`,
      targetId: updated.id,
    });

    return {
      success: true,
      message:
        'Staff directory updated. Administrator access is managed through admin-users.',
      accessManagedSeparately: true,
      staff: {
        id: updated.id,
        staffId: updated.staffId,
        fullName: updated.fullName,
        email: updated.email,
        department: updated.department,
        role: updated.role,
        status: updated.status,
        allowedModules: updated.allowedModules,
        phoneNumber: updated.phoneNumber,
        updatedAt: updated.updatedAt,
      },
    };
  }

  /**
   * Reset staff password and generate new one
   */
  resetStaffPassword(_id: string) {
    throw new ServiceUnavailableException(
      'Use the Firebase password-reset flow; the backend does not issue staff passwords',
    );
  }

  /**
   * Delete / Revoke staff member
   */
  async deleteStaff(id: string) {
    const staff = await this.prisma.adminStaff.findUnique({ where: { id } });
    if (!staff) {
      throw new NotFoundException('Staff member not found.');
    }

    await this.logActivity({
      staffId: 'MASTER_ADMIN',
      staffName: 'Master Admin',
      email: 'hello@stayq.space',
      module: 'staff',
      action: 'REVOKE_STAFF',
      description: `Revoked and deleted staff account ${staff.staffId} (${staff.fullName})`,
      targetId: staff.id,
    });

    await this.prisma.adminStaff.delete({ where: { id } });
    return {
      success: true,
      message:
        'Staff directory entry deleted. Administrator access is managed through admin-users.',
      accessManagedSeparately: true,
    };
  }

  /**
   * Staff login authentication with presence and audit tracking
   */
  async staffLogin(
    identifier: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    throw new UnauthorizedException(
      'Use Firebase authentication with an explicitly assigned administrator role; legacy password-only staff login is disabled',
    );
  }

  /**
   * Staff Heartbeat — keeps presence alive while browser tab is open
   */
  async staffHeartbeat(staffId: string, ipAddress?: string) {
    const staff = await this.prisma.adminStaff.findUnique({
      where: { staffId: staffId.trim().toUpperCase() },
    });

    if (!staff) {
      return { success: false, message: 'Staff member not recognized.' };
    }

    // Check if session was revoked by Master Admin
    if (staff.sessionRevokedAt && staff.lastLoginAt) {
      if (
        new Date(staff.sessionRevokedAt).getTime() >
        new Date(staff.lastLoginAt).getTime()
      ) {
        await this.prisma.adminStaff.update({
          where: { id: staff.id },
          data: { isOnline: false },
        });
        throw new UnauthorizedException(
          'Your session was revoked by Master Admin. Please sign in again.',
        );
      }
    }

    await this.prisma.adminStaff.update({
      where: { id: staff.id },
      data: {
        lastActiveAt: new Date(),
        isOnline: true,
        currentSessionIp: ipAddress || staff.currentSessionIp,
      },
    });

    return { success: true, isOnline: true };
  }

  /**
   * Staff Logout — cleans up presence and logs event
   */
  async staffLogout(staffId: string, ipAddress?: string) {
    const cleanId = staffId.trim().toUpperCase();
    const staff = await this.prisma.adminStaff.findFirst({
      where: {
        OR: [{ staffId: cleanId }, { email: staffId.trim().toLowerCase() }],
      },
    });

    if (staff) {
      const now = new Date();
      await this.prisma.adminStaff.update({
        where: { id: staff.id },
        data: {
          isOnline: false,
          lastLogoutAt: now,
          lastActiveAt: now,
        },
      });

      await this.logActivity({
        staffId: staff.staffId,
        staffName: staff.fullName,
        email: staff.email,
        module: 'auth',
        action: 'STAFF_LOGOUT',
        description: `Staff ${staff.staffId} logged out cleanly`,
        targetId: staff.id,
        ipAddress,
      });
    }

    return { success: true, message: 'Logged out successfully.' };
  }

  /**
   * Master Admin Force Logout — instantly kicks staff off the system
   */
  forceLogoutStaff(_id: string, _actorId?: string, _actorName?: string) {
    throw new ServiceUnavailableException(
      'Use Firebase session revocation; changing directory presence does not revoke identity tokens',
    );
  }

  /**
   * Activity Logger: Records any operational action taken by staff
   */
  async logActivity(data: {
    staffId: string;
    staffName: string;
    email: string;
    module: string;
    action: string;
    description: string;
    targetId?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      return await this.prisma.staffActivityLog.create({
        data: {
          staffId: data.staffId,
          staffName: data.staffName,
          email: data.email,
          module: data.module,
          action: data.action,
          description: data.description,
          targetId: data.targetId || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
        },
      });
    } catch (e) {
      console.warn('[StaffService] Activity log write warning:', e);
      return null;
    }
  }

  /**
   * Fetch recent staff activity audit logs
   */
  async getStaffActivities(query: {
    staffId?: string;
    module?: string;
    limit?: number;
    skip?: number;
  }) {
    const limit = Math.min(
      100,
      Math.max(1, Math.floor(Number(query.limit) || 50)),
    );
    const skip = Math.max(0, Math.floor(Number(query.skip) || 0));

    const where: any = {};
    if (query.staffId && query.staffId !== 'ALL') {
      where.staffId = query.staffId;
    }
    if (query.module && query.module !== 'ALL') {
      where.module = query.module;
    }

    const [total, activities] = await Promise.all([
      this.prisma.staffActivityLog.count({ where }),
      this.prisma.staffActivityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
    ]);

    return {
      success: true,
      total,
      count: activities.length,
      activities,
    };
  }
}
