/**
 * Centralized Role Registry for the Back-Office application.
 * Refer to this file to see the security architecture at a glance.
 */
export enum SecurityRoles {
  Admin = 'Admin',
  Manager = 'Manager',
  Auditor = 'Auditor',
  User = 'User'
}

/**
 * Permission Groups
 */
export const IsManagement = (role: string | null): boolean => {
  return role === SecurityRoles.Admin || role === SecurityRoles.Manager;
};

export const IsAdmin = (role: string | null): boolean => {
  return role === SecurityRoles.Admin;
};
