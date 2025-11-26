/**
 * Admin utility functions
 * Check if a user has admin access
 */

// List of admin emails (from environment variable)
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || [];

/**
 * Check if an email has admin access
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Get all admin emails
 */
export function getAdminEmails(): string[] {
  return ADMIN_EMAILS;
}

/**
 * Check if user object has admin access
 */
export function isUserAdmin(user: { email?: string | null } | null | undefined): boolean {
  return isAdmin(user?.email);
}
