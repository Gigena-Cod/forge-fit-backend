export const roles = ['OWNER', 'ADMIN', 'RECEPTIONIST'] as const
export type Role = typeof roles[number]
export type Permission =
  | 'members:read' | 'members:write' | 'members:status' | 'members:qr'
  | 'payments:read' | 'payments:write' | 'payments:void'
  | 'attendance:read' | 'attendance:check-in'
  | 'users:read' | 'users:write' | 'roles:read' | 'reports:read' | 'settings:write'

export const permissions: Record<Role, readonly Permission[]> = {
  OWNER: ['members:read', 'members:write', 'members:status', 'members:qr', 'payments:read', 'payments:write', 'payments:void', 'attendance:read', 'attendance:check-in', 'users:read', 'users:write', 'roles:read', 'reports:read', 'settings:write'],
  ADMIN: ['members:read', 'members:write', 'members:status', 'members:qr', 'payments:read', 'payments:write', 'payments:void', 'attendance:read', 'attendance:check-in', 'users:read', 'roles:read', 'reports:read', 'settings:write'],
  RECEPTIONIST: ['members:read', 'members:write', 'payments:read', 'payments:write', 'attendance:read', 'attendance:check-in'],
}

export function isRole(value: string): value is Role { return roles.includes(value as Role) }
export function hasPermission(role: string, permission: string) { return isRole(role) && permissions[role].includes(permission as Permission) }
