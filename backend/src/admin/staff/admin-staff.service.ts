import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
export class AdminStaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * List all staff members
   */
  async getAllStaff() {
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
        createdAt: true,
        updatedAt: true,
      },
    });
    return {
      success: true,
      count: staff.length,
      staff,
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
  }) {
    const existing = await this.prisma.adminStaff.findFirst({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (existing) {
      throw new BadRequestException('A staff member with this email already exists.');
    }

    // Generate unique Staff ID: e.g. SQ-EMP-1049
    const count = await this.prisma.adminStaff.count();
    const staffId = `SQ-EMP-${1000 + count + 1}`;

    const plainPassword = dto.customPassword?.trim() || generateSecurePassword();
    const passwordHash = hashPassword(plainPassword);

    const newStaff = await this.prisma.adminStaff.create({
      data: {
        staffId,
        fullName: dto.fullName.trim(),
        email: dto.email.trim().toLowerCase(),
        passwordHash,
        department: dto.department || 'Operations',
        role: dto.role || 'STAFF',
        status: 'ACTIVE',
        allowedModules: dto.allowedModules && dto.allowedModules.length > 0
          ? dto.allowedModules
          : ['properties', 'bookings'],
        phoneNumber: dto.phoneNumber?.trim() || null,
      },
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
      data: { passwordHash },
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

    await this.prisma.adminStaff.delete({ where: { id } });
    return {
      success: true,
      message: `Staff member ${staff.staffId} (${staff.fullName}) access has been permanently revoked.`,
    };
  }

  /**
   * Staff login authentication
   */
  async staffLogin(identifier: string, password: string) {
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

    // Update last login timestamp
    await this.prisma.adminStaff.update({
      where: { id: staff.id },
      data: { lastLoginAt: new Date() },
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
      },
    };
  }
}
