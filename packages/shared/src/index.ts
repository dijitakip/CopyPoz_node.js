export type UserRole = 'admin' | 'trader' | 'viewer';
export type LicenseStatus = 'valid' | 'expired' | 'invalid';
export const VALID_COMMANDS = ['PAUSE', 'RESUME', 'CLOSE_ALL_BUY', 'CLOSE_ALL_SELL', 'CLOSE_ALL'] as const;
