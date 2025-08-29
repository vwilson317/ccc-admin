// Session utility functions
export const isSessionValid = (expiresAt: string | null): boolean => {
  if (!expiresAt) return false;
  return new Date() < new Date(expiresAt);
};

export const getSessionExpiryTime = (): Date => {
  // Return 24 hours from now
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
};

export const formatLastLogin = (lastLogin: string | null): string => {
  if (!lastLogin) return 'Never';
  return new Date(lastLogin).toLocaleString();
};

export const getRoleDisplayName = (role: 'admin' | 'special_admin'): string => {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'special_admin':
      return 'Special Administrator';
    default:
      return 'Unknown';
  }
};
