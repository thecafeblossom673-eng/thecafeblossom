/**
 * Password Management Utility
 * Stores both app passwords in localStorage so they can be changed
 * without code changes. All reads/writes are client-side only.
 */

const PASSWORDS_KEY = 'cafe_blossom_passwords';

export interface AppPasswords {
  /** Staff portal login password (for /admin, /tables, /history) */
  staff: string;
  /** Inventory page gate password (asked every visit, no session caching) */
  inventory: string;
}

const DEFAULTS: AppPasswords = {
  staff: 'cafe7707',
  inventory: 'cafe7707',
};

/** Read both stored passwords, falling back to defaults. */
export function getPasswords(): AppPasswords {
  if (typeof window === 'undefined') return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(PASSWORDS_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

/** Verify a password against the stored value. */
export function verifyPassword(type: keyof AppPasswords, input: string): boolean {
  return getPasswords()[type] === input;
}

/** Persist a new password for the given type. */
export function updatePassword(type: keyof AppPasswords, newPassword: string): void {
  if (typeof window === 'undefined') return;
  const current = getPasswords();
  current[type] = newPassword;
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(current));
}
