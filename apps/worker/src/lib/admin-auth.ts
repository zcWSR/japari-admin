/** 与 Worker admin-api 一致：Cookie 名与 KV session key 前缀 */
export const COOKIE_TOKEN_NAME = 'admin_token';
export const ADMIN_SESSION_PREFIX = 'admin-session:';

export function getAdminApiBase(): string {
  if (typeof window !== 'undefined') return '';
  return process.env.NEXT_PUBLIC_ADMIN_API_BASE ?? '';
}
