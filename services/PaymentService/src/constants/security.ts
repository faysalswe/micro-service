/**
 * Centralized Role Registry for the Payment Service.
 * Ensures parity with IdentityService and Go Inventory Service.
 */
export enum SecurityRoles {
  Admin = 'Admin',
  Manager = 'Manager',
  Auditor = 'Auditor',
  User = 'User'
}

/**
 * Permission Helpers
 */
export const isManagement = (role: string): boolean => {
  return role === SecurityRoles.Admin || role === SecurityRoles.Manager;
};

export const isAdmin = (role: string): boolean => {
  return role === SecurityRoles.Admin;
};
