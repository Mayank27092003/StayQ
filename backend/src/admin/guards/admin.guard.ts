import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user?.isAdmin || user.deletedAt)
      throw new ForbiddenException('Admin access required');
    if (user.adminRole === 'SUPER_ADMIN') return true;
    if (!user.adminRole)
      throw new ForbiddenException('An explicit admin role is required');
    const path = String(req.path || req.url).split('?')[0];
    if (
      /\/admin\/staff\/(heartbeat|logout)$/.test(path) &&
      req.method === 'POST' &&
      ['OPERATIONS', 'TRUST_SAFETY', 'FINANCE', 'MARKETING'].includes(
        user.adminRole,
      )
    )
      return true;
    if (/\/(staff|admin-users)(\/|$)|\/users\/[^/]+\/roles|\/test-/.test(path))
      throw new ForbiddenException('Super admin access required');
    if (/\/export(\/|$)/.test(path))
      throw new ForbiddenException(
        'Super admin access required for data export',
      );
    const read = ['GET', 'HEAD'].includes(req.method);
    let roles: string[] = [];
    if (/\/wallet\/.*credit/.test(path)) roles = ['FINANCE'];
    else if (/\/(refund|refunds)(\/|$)|\/payout\//.test(path))
      roles = ['FINANCE'];
    else if (
      /\/(commission-settings|settings|analytics|reports|export|earnings)(\/|$)/.test(
        path,
      )
    )
      roles = read ? ['FINANCE', 'OPERATIONS'] : ['FINANCE'];
    else if (
      /\/(promotions|broadcasts|featured|featured-content|catalog|banners)(\/|$)/.test(
        path,
      )
    )
      roles = ['MARKETING', 'OPERATIONS'];
    else if (
      /\/(moderation|host-applications|disputes|reviews)(\/|$)/.test(path)
    )
      roles = ['TRUST_SAFETY'];
    else if (
      /\/(bookings|properties|hosts|host-leads|experiences|support|conversations|qube)(\/|$)/.test(
        path,
      )
    )
      roles = read
        ? ['OPERATIONS', 'TRUST_SAFETY', 'FINANCE']
        : ['OPERATIONS', 'TRUST_SAFETY'];
    else if (/\/admin\/(me|dashboard|audit-logs)$/.test(path))
      roles = ['OPERATIONS', 'TRUST_SAFETY', 'FINANCE', 'MARKETING'];
    else if (/\/users$/.test(path) && read)
      roles = ['OPERATIONS', 'TRUST_SAFETY'];
    if (!roles.includes(user.adminRole))
      throw new ForbiddenException(
        'Your admin role cannot perform this operation',
      );
    return true;
  }
}
