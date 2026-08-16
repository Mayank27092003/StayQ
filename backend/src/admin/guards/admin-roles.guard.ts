import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole } from '@prisma/client';
import { ADMIN_ROLES_KEY } from '../decorators/admin-roles.decorator';

@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[] | undefined>(
      ADMIN_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No decorator on the route: AdminGuard's `isAdmin` check is sufficient.
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user?.isAdmin) {
      throw new ForbiddenException('Admin access required');
    }

    // SUPER_ADMIN is unconditionally permitted.
    if (user.adminRole === AdminRole.SUPER_ADMIN) return true;

    // Backward compatibility: admins provisioned before `adminRole` existed have
    // `isAdmin: true` with a null `adminRole`. Denying them here would lock
    // existing operators out of the panel, so they retain access. Assign an
    // explicit `adminRole` to every admin, then remove this allowance to make
    // the policy matrix fully enforcing.
    if (!user.adminRole) return true;

    if (!requiredRoles.includes(user.adminRole)) {
      throw new ForbiddenException(
        `This action requires one of the following admin roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
