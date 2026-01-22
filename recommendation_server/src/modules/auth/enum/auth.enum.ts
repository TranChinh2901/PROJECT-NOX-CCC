
export enum RoleType {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export const RoleHierarchy: Record<RoleType, number> = {
  [RoleType.ADMIN]: 100,
  [RoleType.USER]: 10,
};

export const hasPermission = (userRole: RoleType, requiredRole: RoleType): boolean => {
  return RoleHierarchy[userRole] >= RoleHierarchy[requiredRole];
};
