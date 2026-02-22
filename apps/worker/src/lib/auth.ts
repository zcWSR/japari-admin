/**
 * 与原 worker admin-api 鉴权一致：Cookie admin_token === ADMIN_SECRET 为超管，否则查 KV admin-session:${token}。
 * Config/KV 内部已用 getCloudflareContext().env，无需额外注入。
 */
import Config from '@/config.js';
import KVService from '@/services/kv-service.js';

const ADMIN_SESSION_PREFIX = 'admin-session:';
export const COOKIE_TOKEN_NAME = 'admin_token';

export type Auth =
  | { isAdminToken: true }
  | { isAdminToken: false; groupId: string; adminId?: string };

function parseToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const m = cookieHeader.match(new RegExp(`${COOKIE_TOKEN_NAME}=([^;]+)`));
  return m ? decodeURIComponent(m[1].trim()) : null;
}

export async function getAuth(cookieHeader: string | null): Promise<Auth | null> {
  const token = parseToken(cookieHeader);
  if (!token) return null;
  const adminSecret = Config.ADMIN_SECRET as string | undefined;
  if (adminSecret && token === adminSecret) {
    return { isAdminToken: true };
  }
  const sessionRaw = await KVService.get(`${ADMIN_SESSION_PREFIX}${token}`);
  if (!sessionRaw) return null;
  let session: { groupId?: string; adminId?: string };
  try {
    session = JSON.parse(sessionRaw);
  } catch {
    return null;
  }
  const { groupId } = session;
  if (!groupId) return null;
  return { isAdminToken: false, groupId, adminId: session.adminId };
}

export function requireGroupAccess(auth: Auth | null, groupId: string): boolean {
  if (!auth) return false;
  if (auth.isAdminToken) return true;
  return auth.groupId === groupId;
}

export function requireAdminToken(auth: Auth | null): boolean {
  return !!auth?.isAdminToken;
}
