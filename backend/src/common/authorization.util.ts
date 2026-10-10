export function hasAdminRole(user: any, roles: string[]): boolean {
  return (
    !!user?.isAdmin &&
    !user.deletedAt &&
    (user.adminRole === 'SUPER_ADMIN' || roles.includes(user.adminRole))
  );
}
export function isOperationsAdmin(user: any): boolean {
  return hasAdminRole(user, ['OPERATIONS', 'TRUST_SAFETY']);
}
export function isFinanceAdmin(user: any): boolean {
  return hasAdminRole(user, ['FINANCE']);
}
