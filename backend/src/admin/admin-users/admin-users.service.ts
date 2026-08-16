import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdminRole, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditService } from '../audit/admin-audit.service';
import { buildPaginatedResult, PaginatedResult, toSkipTake } from '../dto/pagination.dto';
import {
  AdminUserQueryDto,
  GrantAdminAccessDto,
  RevokeAdminAccessDto,
  UpdateAdminRoleDto,
} from './dto/admin-user.dto';

const ADMIN_SELECT = {
  id: true,
  email: true,
  displayName: true,
  photoUrl: true,
  phone: true,
  roles: true,
  isAdmin: true,
  adminRole: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

type AdminUserRecord = Prisma.UserGetPayload<{ select: typeof ADMIN_SELECT }>;

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  async list(query: AdminUserQueryDto): Promise<PaginatedResult<AdminUserRecord>> {
    const { skip, take } = toSkipTake(query);

    const where: Prisma.UserWhereInput = {
      isAdmin: query.isAdmin ?? true,
    };
    if (query.adminRole) where.adminRole = query.adminRole;
    if (query.search) {
      where.OR = [
        { displayName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: [{ adminRole: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
        select: ADMIN_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginatedResult(users, total, query);
  }

  async findOne(id: string): Promise<AdminUserRecord> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: ADMIN_SELECT });
    if (!user) throw new NotFoundException('Account not found.');
    return user;
  }

  /** Recent audit activity attributed to one admin. */
  async activity(id: string, limit = 50) {
    const admin = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!admin) throw new NotFoundException('Account not found.');

    return this.prisma.adminAuditLog.findMany({
      where: { adminId: id },
      orderBy: { createdAt: 'desc' },
      take: Math.min(200, Math.max(1, limit)),
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        details: true,
        createdAt: true,
      },
    });
  }

  /**
   * Grants admin access. Restricted to SUPER_ADMIN at the controller; the reason
   * is mandatory so every privilege escalation carries a justification.
   */
  async grantAccess(
    targetUserId: string,
    dto: GrantAdminAccessDto,
    actingAdminId: string,
  ): Promise<AdminUserRecord> {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, isAdmin: true, adminRole: true, email: true },
    });
    if (!target) throw new NotFoundException('Account not found.');
    if (target.isAdmin) {
      throw new BadRequestException(
        'This account already has admin access. Use the role endpoint to change its admin role.',
      );
    }

    return this.audit.runWithAudit(
      (tx) =>
        tx.user.update({
          where: { id: targetUserId },
          data: { isAdmin: true, adminRole: dto.adminRole },
          select: ADMIN_SELECT,
        }),
      (user) => ({
        adminId: actingAdminId,
        action: 'GRANT_ADMIN_ACCESS',
        targetType: 'ADMIN_USER',
        targetId: user.id,
        details: { grantedRole: dto.adminRole, reason: dto.reason, email: target.email },
      }),
    );
  }

  async updateRole(
    targetUserId: string,
    dto: UpdateAdminRoleDto,
    actingAdminId: string,
  ): Promise<AdminUserRecord> {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, isAdmin: true, adminRole: true },
    });
    if (!target) throw new NotFoundException('Account not found.');
    if (!target.isAdmin) {
      throw new BadRequestException('This account does not have admin access yet.');
    }

    // Demoting yourself out of SUPER_ADMIN can strip the ability to restore it.
    if (
      targetUserId === actingAdminId &&
      target.adminRole === AdminRole.SUPER_ADMIN &&
      dto.adminRole !== AdminRole.SUPER_ADMIN
    ) {
      await this.assertNotLastSuperAdmin(targetUserId);
    }

    return this.audit.runWithAudit(
      (tx) =>
        tx.user.update({
          where: { id: targetUserId },
          data: { adminRole: dto.adminRole },
          select: ADMIN_SELECT,
        }),
      (user) => ({
        adminId: actingAdminId,
        action: 'UPDATE_ADMIN_ROLE',
        targetType: 'ADMIN_USER',
        targetId: user.id,
        details: { previousRole: target.adminRole, newRole: dto.adminRole, reason: dto.reason },
      }),
    );
  }

  /**
   * Removes admin access. Refuses to remove the final SUPER_ADMIN, which would
   * leave the platform with no account able to restore privileges.
   */
  async revokeAccess(
    targetUserId: string,
    dto: RevokeAdminAccessDto,
    actingAdminId: string,
  ): Promise<AdminUserRecord> {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, isAdmin: true, adminRole: true, email: true },
    });
    if (!target) throw new NotFoundException('Account not found.');
    if (!target.isAdmin) {
      throw new BadRequestException('This account does not have admin access.');
    }

    if (target.adminRole === AdminRole.SUPER_ADMIN) {
      await this.assertNotLastSuperAdmin(targetUserId);
    }

    return this.audit.runWithAudit(
      (tx) =>
        tx.user.update({
          where: { id: targetUserId },
          data: { isAdmin: false, adminRole: null },
          select: ADMIN_SELECT,
        }),
      (user) => ({
        adminId: actingAdminId,
        action: 'REVOKE_ADMIN_ACCESS',
        targetType: 'ADMIN_USER',
        targetId: user.id,
        details: { previousRole: target.adminRole, reason: dto.reason, email: target.email },
      }),
    );
  }

  private async assertNotLastSuperAdmin(excludingUserId: string): Promise<void> {
    const remaining = await this.prisma.user.count({
      where: { isAdmin: true, adminRole: AdminRole.SUPER_ADMIN, id: { not: excludingUserId } },
    });

    if (remaining === 0) {
      throw new ForbiddenException(
        'This is the only SUPER_ADMIN account. Promote another account to SUPER_ADMIN before changing this one.',
      );
    }
  }

  async summary() {
    const [totalAdmins, byRole, withoutRole] = await Promise.all([
      this.prisma.user.count({ where: { isAdmin: true } }),
      this.prisma.user.groupBy({
        by: ['adminRole'],
        where: { isAdmin: true },
        _count: { _all: true },
      }),
      this.prisma.user.count({ where: { isAdmin: true, adminRole: null } }),
    ]);

    return {
      totalAdmins,
      byRole: Object.fromEntries(
        byRole
          .filter((row) => row.adminRole !== null)
          .map((row) => [row.adminRole as AdminRole, row._count._all]),
      ),
      // Legacy admins with no explicit role still hold full access; surfacing
      // the count lets operators tighten the policy matrix.
      withoutExplicitRole: withoutRole,
    };
  }
}
