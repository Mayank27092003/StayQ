import { SetMetadata } from '@nestjs/common';
import { AdminRole } from '@prisma/client';

export const ADMIN_ROLES_KEY = 'adminRoles';

/**
 * Restricts a route to specific `AdminRole` values.
 *
 * `SUPER_ADMIN` always passes. Applies on top of `AdminGuard`, which already
 * requires `user.isAdmin`; this decorator narrows *which* admins may proceed.
 *
 * Usage: `@AdminRoles(AdminRole.FINANCE, AdminRole.OPERATIONS)`
 */
export const AdminRoles = (...roles: AdminRole[]) => SetMetadata(ADMIN_ROLES_KEY, roles);
