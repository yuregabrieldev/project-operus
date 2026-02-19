/**
 * Developer access: emails that are always treated as developer role
 * (bypass brand selection even if profile fails to load).
 * Set VITE_DEVELOPER_EMAILS (comma-separated) in .env to add more.
 */
const DEFAULT_DEVELOPER_EMAILS = ['developer.yuregabriel@gmail.com'];

function getDeveloperEmails(): string[] {
  const env = import.meta.env.VITE_DEVELOPER_EMAILS;
  if (typeof env === 'string' && env.trim()) {
    return [...new Set([...DEFAULT_DEVELOPER_EMAILS, ...env.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)])];
  }
  return DEFAULT_DEVELOPER_EMAILS;
}

const _emails = getDeveloperEmails();

export function isDeveloperEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return _emails.includes(email.trim().toLowerCase());
}

export function isDeveloper(user: { role?: string; email?: string | null } | null): boolean {
  if (!user) return false;
  if (user.role === 'developer') return true;
  return isDeveloperEmail(user.email);
}
