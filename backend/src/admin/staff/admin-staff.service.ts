import { Injectable, BadRequestException, NotFoundException, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../notifications/email.service';
import * as crypto from 'crypto';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, combined: string): boolean {
  if (!combined || !combined.includes(':')) return false;
  const [salt, key] = combined.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return key === hash;
}

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  let password = 'SQ@';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

@Injectable()
export class AdminStaffService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async onModuleInit() {
    // Check and auto-seed initial 3 staff accounts if database has 0 staff
    try {
      const count = await this.prisma.adminStaff.count();
      if (count === 0) {
        await this.seedInitialStaff();
      }
    } catch (e) {
      console.warn('[AdminStaffService] Auto-seed check failed or skipped:', e);
    }
  }

  /**
   * Seed 3 initial staff accounts matching the user's operational structure:
   * 1. Bookings & Inventory Staff (SQ-EMP-1001)
   * 2. Accounts & Finance Staff (SQ-EMP-1002)
   * 3. Customer Support Staff (SQ-EMP-1003)
   */
  async seedInitialStaff() {
    const defaultPassword = 'StayQ@Staff2026';
    const passwordHash = hashPassword(defaultPassword);

    const initialStaff = [
      {
        staffId: 'SQ-EMP-1001',
        fullName: 'Operations Desk',
        email: 'hello@stayq.space',
        department: 'Operations & Ground Ops',
        role: 'MASTER_ADMIN',
        status: 'ACTIVE',
        allowedModules: ['bookings', 'properties', 'experiences', 'revenue', 'taxes', 'analytics', 'export', 'staff'],
        phoneNumber: '+91 92252 70718',
      },
      {
        staffId: 'SQ-EMP-1002',
        fullName: 'Stay Q Support Desk',
        email: 'support@stayq.space',
        department: 'Customer Support Desk',
        role: 'STAFF',
        status: 'ACTIVE',
        allowedModules: ['support', 'reviews', 'bookings'],
        phoneNumber: '+91 92252 70718',
      },
      {
        staffId: 'SQ-EMP-1003',
        fullName: 'Grievance Officer',
        email: 'grievance@stayq.space',
        department: 'Trust, Safety & Legal Grievance',
        role: 'STAFF',
        status: 'ACTIVE',
        allowedModules: ['support', 'moderation', 'reviews'],
        phoneNumber: '+91 92252 70718',
      },
    ];

    for (const s of initialStaff) {
      const exists = await this.prisma.adminStaff.findFirst({
        where: { OR: [{ email: s.email }, { staffId: s.staffId }] },
      });
      if (!exists) {
        await this.prisma.adminStaff.create({
          data: {
            ...s,
            passwordHash,
          },
        });
        // Create initial creation audit log
        await this.prisma.staffActivityLog.create({
          data: {
            staffId: 'SYSTEM',
            staffName: 'Platform Initialization',
            email: 'hello@stayq.space',
            module: 'staff',
            action: 'INITIAL_SEED',
            description: `Provisioned initial staff account ${s.staffId} (${s.fullName}) for ${s.department}`,
          },
        });
      }
    }
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
      throw new BadRequestException('A staff member with this email already exists.');
    }

    // Generate unique Staff ID or use custom
    let staffId = dto.customStaffId?.trim().toUpperCase();
    if (!staffId) {
      const count = await this.prisma.adminStaff.count();
      staffId = `SQ-EMP-${1000 + count + 1}`;
    } else {
      const idExists = await this.prisma.adminStaff.findUnique({ where: { staffId } });
      if (idExists) {
        throw new BadRequestException(`Staff ID ${staffId} is already assigned to another employee.`);
      }
    }

    const plainPassword = dto.customPassword?.trim() || generateSecurePassword();
    const passwordHash = hashPassword(plainPassword);

    const newStaff = await this.prisma.adminStaff.create({
      data: {
        staffId,
        fullName: dto.fullName.trim(),
        email: dto.email.trim().toLowerCase(),
        passwordHash,
        department: dto.department || 'Operations & Ground Ops',
        role: dto.role || 'STAFF',
        status: 'ACTIVE',
        allowedModules: dto.allowedModules && dto.allowedModules.length > 0
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

    // Send Welcome Email with credentials via Hostinger SMTP
    try {
      await this.emailService.sendStaffCredentialsEmail({
        staffName: newStaff.fullName,
        staffId: newStaff.staffId,
        email: newStaff.email,
        initialPassword: plainPassword,
        department: newStaff.department,
        allowedModules: newStaff.allowedModules,
      });
    } catch (err) {
      console.warn('[StaffService] Email notification warning:', err);
    }

    return {
      success: true,
      message: 'Staff member created successfully.',
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
      credentials: {
        staffId: newStaff.staffId,
        email: newStaff.email,
        plainPassword,
      },
    };
  }

  /**
   * Update staff permissions or status
   */
  async updateStaff(id: string, dto: {
    fullName?: string;
    department?: string;
    role?: string;
    status?: string;
    allowedModules?: string[];
    phoneNumber?: string;
    newPassword?: string;
    adminStaffId?: string;
    adminStaffName?: string;
  }) {
    const staff = await this.prisma.adminStaff.findUnique({ where: { id } });
    if (!staff) {
      throw new NotFoundException('Staff member not found.');
    }

    const updateData: any = {};
    if (dto.fullName) updateData.fullName = dto.fullName.trim();
    if (dto.department) updateData.department = dto.department;
    if (dto.role) updateData.role = dto.role;
    if (dto.status) updateData.status = dto.status;
    if (dto.allowedModules) updateData.allowedModules = dto.allowedModules;
    if (dto.phoneNumber !== undefined) updateData.phoneNumber = dto.phoneNumber;
    if (dto.newPassword && dto.newPassword.trim().length >= 6) {
      updateData.passwordHash = hashPassword(dto.newPassword.trim());
    }

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
      message: 'Staff profile and permissions updated.',
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
  async resetStaffPassword(id: string) {
    const staff = await this.prisma.adminStaff.findUnique({ where: { id } });
    if (!staff) {
      throw new NotFoundException('Staff member not found.');
    }

    const plainPassword = generateSecurePassword();
    const passwordHash = hashPassword(plainPassword);

    await this.prisma.adminStaff.update({
      where: { id },
      data: { passwordHash, sessionRevokedAt: new Date(), isOnline: false },
    });

    await this.logActivity({
      staffId: 'MASTER_ADMIN',
      staffName: 'Master Admin',
      email: 'hello@stayq.space',
      module: 'staff',
      action: 'RESET_PASSWORD',
      description: `Reset password for staff member ${staff.staffId} (${staff.fullName})`,
      targetId: staff.id,
    });

    // Dispatch update mail
    try {
      await this.emailService.sendStaffCredentialsEmail({
        staffName: staff.fullName,
        staffId: staff.staffId,
        email: staff.email,
        initialPassword: plainPassword,
        department: staff.department,
        allowedModules: staff.allowedModules,
      });
    } catch (err) {
      console.warn('[StaffService] Email dispatch warning:', err);
    }

    return {
      success: true,
      message: 'Password reset successfully.',
      credentials: {
        staffId: staff.staffId,
        email: staff.email,
        plainPassword,
      },
    };
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
      message: `Staff member ${staff.staffId} (${staff.fullName}) access has been permanently revoked.`,
    };
  }

  /**
   * Staff login authentication with presence and audit tracking
   */
  async staffLogin(identifier: string, password: string, ipAddress?: string, userAgent?: string) {
    const cleanId = identifier.trim().toLowerCase();
    const staff = await this.prisma.adminStaff.findFirst({
      where: {
        OR: [
          { email: cleanId },
          { staffId: identifier.trim().toUpperCase() },
        ],
      },
    });

    if (!staff) {
      throw new UnauthorizedException('Invalid Staff ID / Email or Password.');
    }

    if (staff.status !== 'ACTIVE') {
      throw new UnauthorizedException('This staff account is currently inactive or suspended. Contact Master Admin.');
    }

    const isValid = verifyPassword(password, staff.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid Staff ID / Email or Password.');
    }

    const now = new Date();

    // Mark online and update timestamps
    await this.prisma.adminStaff.update({
      where: { id: staff.id },
      data: {
        lastLoginAt: now,
        lastActiveAt: now,
        isOnline: true,
        currentSessionIp: ipAddress || 'Direct Gateway',
      },
    });

    // Record login activity in audit log
    await this.logActivity({
      staffId: staff.staffId,
      staffName: staff.fullName,
      email: staff.email,
      module: 'auth',
      action: 'STAFF_LOGIN',
      description: `Staff ${staff.staffId} logged in to Command Center from ${ipAddress || 'Web Gateway'}`,
      targetId: staff.id,
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'Authentication successful.',
      user: {
        id: staff.id,
        staffId: staff.staffId,
        fullName: staff.fullName,
        email: staff.email,
        department: staff.department,
        role: staff.role,
        allowedModules: staff.allowedModules,
        lastLoginAt: now,
      },
    };
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
      if (new Date(staff.sessionRevokedAt).getTime() > new Date(staff.lastLoginAt).getTime()) {
        await this.prisma.adminStaff.update({
          where: { id: staff.id },
          data: { isOnline: false },
        });
        throw new UnauthorizedException('Your session was revoked by Master Admin. Please sign in again.');
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
      where: { OR: [{ staffId: cleanId }, { email: staffId.trim().toLowerCase() }] },
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
  async forceLogoutStaff(id: string, adminStaffId?: string, adminStaffName?: string) {
    const staff = await this.prisma.adminStaff.findUnique({ where: { id } });
    if (!staff) {
      throw new NotFoundException('Staff member not found.');
    }

    const now = new Date();
    await this.prisma.adminStaff.update({
      where: { id },
      data: {
        isOnline: false,
        sessionRevokedAt: now,
        lastLogoutAt: now,
      },
    });

    await this.logActivity({
      staffId: adminStaffId || 'MASTER_ADMIN',
      staffName: adminStaffName || 'Master Admin',
      email: 'hello@stayq.space',
      module: 'staff',
      action: 'FORCE_LOGOUT',
      description: `Force terminated active session for staff member ${staff.staffId} (${staff.fullName})`,
      targetId: staff.id,
    });

    return {
      success: true,
      message: `Active session for ${staff.staffId} (${staff.fullName}) has been terminated.`,
    };
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
    const limit = Math.min(Number(query.limit || 50), 100);
    const skip = Number(query.skip || 0);

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
