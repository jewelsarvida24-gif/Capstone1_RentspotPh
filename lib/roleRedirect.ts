// lib/roleRedirect.ts
/**
 * Redirect users to their appropriate dashboard based on their role
 */

export const getRoleRedirectPath = (role: string | null | undefined): string => {
  switch (role) {
    case 'sysadmin':
      return '/sysadmin';
    case 'admin':
      return '/admin/dashboard';
    case 'customer':
      return '/renter/my-rentals';
    default:
      return '/guest/browse';
  }
};

/**
 * Check if user has required role(s)
 */
export const hasRole = (
  userRole: string | null | undefined,
  requiredRoles: string | string[]
): boolean => {
  if (!userRole) return false;
  if (typeof requiredRoles === 'string') {
    return userRole === requiredRoles;
  }
  return requiredRoles.includes(userRole);
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (role: string): string => {
  const roleNames: Record<string, string> = {
    sysadmin: 'System Administrator',
    admin: 'Admin',
    customer: 'Renter',
    guest: 'Guest',
  };
  return roleNames[role] || role;
};

/**
 * Get role color for UI
 */
export const getRoleColor = (role: string): string => {
  const colors: Record<string, string> = {
    sysadmin: 'bg-purple-100 text-purple-800',
    admin: 'bg-blue-100 text-blue-800',
    customer: 'bg-green-100 text-green-800',
    guest: 'bg-gray-100 text-gray-800',
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
};
