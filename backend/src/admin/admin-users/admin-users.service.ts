import { text } from '../../common/utils/input.util';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdminRole, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditService } from '../audit/admin-audit.service';
import {
  buildPaginatedResult,
  PaginatedResult,
  toSkipTake,
} from '../dto/pagination.dto';
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
  private async changeAccess(
    targetId: string,
    role: AdminRole | null,
    actorId: string,
    reason: string,
    kind: string,
  ) {
    text(reason, 'Reason', 2000);
    if (role !== null && !Object.values(AdminRole).includes(role))
      throw new BadRequestException('Invalid administrator role');
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('admin-privileges',0))`;
      const actor = await tx.user.findUnique({ where: { id: actorId } });
      if (
        !actor?.isAdmin ||
        actor.adminRole !== 'SUPER_ADMIN' ||
        actor.deletedAt
      )
        throw new ForbiddenException('Current super admin required');
      const target = await tx.user.findUnique({ where: { id: targetId } });
      if (!target || target.deletedAt)
        throw new NotFoundException('Active account not found');
      if (kind === 'GRANT' && target.isAdmin)
        throw new BadRequestException('Account is already an administrator');
      if (kind !== 'GRANT' && !target.isAdmin)
        throw new BadRequestException('Account is not an administrator');
      if (
        target.adminRole === 'SUPER_ADMIN' &&
        role !== 'SUPER_ADMIN' &&
        (await tx.user.count({
          where: {
            id: { not: targetId },
            isAdmin: true,
            adminRole: 'SUPER_ADMIN',
            deletedAt: null,
          },
        })) === 0
      )
        throw new ForbiddenException(
          'Promote another super admin before removing the final one',
        );
      const result = await tx.user.update({
        where: { id: targetId },
        data: { isAdmin: role !== null, adminRole: role },
        select: ADMIN_SELECT,
      });
      await tx.adminAuditLog.create({
        data: {
          adminId: actorId,
          action: kind + '_ADMIN_ACCESS',
          targetType: 'ADMIN_USER',
          targetId,
          details: { previousRole: target.adminRole, newRole: role, reason },
        },
      });
      return result;
    });
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  async list(
    query: AdminUserQueryDto,
  ): Promise<PaginatedResult<AdminUserRecord>> {
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
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: ADMIN_SELECT,
    });
    if (!user) throw new NotFoundException('Account not found.');
    return user;
  }

  /** Recent audit activity attributed to one admin. */
  async activity(id: string, limit = 50) {
    const admin = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
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
    id: string,
    dto: GrantAdminAccessDto,
    actor: string,
  ): Promise<AdminUserRecord> {
    return this.changeAccess(id, dto.adminRole, actor, dto.reason, 'GRANT');
  }

  async updateRole(
    id: string,
    dto: UpdateAdminRoleDto,
    actor: string,
  ): Promise<AdminUserRecord> {
    return this.changeAccess(id, dto.adminRole, actor, dto.reason, 'CHANGE');
  }

  /**
   * Removes admin access. Refuses to remove the final SUPER_ADMIN, which would
   * leave the platform with no account able to restore privileges.
   */
  async revokeAccess(
    id: string,
    dto: RevokeAdminAccessDto,
    actor: string,
  ): Promise<AdminUserRecord> {
    return this.changeAccess(id, null, actor, dto.reason, 'REVOKE');
  }

  private async assertNotLastSuperAdmin(
    excludingUserId: string,
  ): Promise<void> {
    const remaining = await this.prisma.user.count({
      where: {
        isAdmin: true,
        adminRole: AdminRole.SUPER_ADMIN,
        id: { not: excludingUserId },
      },
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
      // Legacy administrators require an explicit role; surfacing
      // the count lets operators tighten the policy matrix.
      withoutExplicitRole: withoutRole,
    };
  }
}
