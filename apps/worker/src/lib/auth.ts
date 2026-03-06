/**
 * 管理后台鉴权：仅使用 KV 会话（admin-session:${token}）。
 */
import KVService from '@/services/kv-service';

export const ADMIN_SESSION_PREFIX = 'admin-session:';
export const COOKIE_TOKEN_NAME = 'admin_token';

export interface AuthSession {
  groupId: string | null;
  adminId: string;
  qq: string;
  isAdminToken: boolean;
  displayName: string | null;
  avatarUrl: string | null;
  ttlSeconds: number;
  expiresAt: number;
  createdAt: number;
}

export interface Auth extends AuthSession {
  sessionToken: string;
}

export function parseToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const m = cookieHeader.match(new RegExp(`${COOKIE_TOKEN_NAME}=([^;]+)`));
  return m ? decodeURIComponent(m[1].trim()) : null;
}

export function getSessionKey(sessionToken: string): string {
  return `${ADMIN_SESSION_PREFIX}${sessionToken}`;
}

export function getAvatarUrl(qq: string): string {
  return `https://q1.qlogo.cn/g?b=qq&nk=${encodeURIComponent(qq)}&s=100`;
}

function normalizeSession(raw: unknown): AuthSession | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  const adminId = String(data.adminId ?? '');
  const groupIdRaw = data.groupId;
  const groupId =
    groupIdRaw == null || groupIdRaw === '' ? null : String(groupIdRaw);
  if (!adminId) return null;
  const qq = String(data.qq ?? adminId);
  const isAdminToken = Boolean(data.isAdminToken ?? false);
  const ttlSeconds = Number(data.ttlSeconds ?? 0);
  const expiresAt = Number(data.expiresAt ?? 0);
  const createdAt = Number(data.createdAt ?? Date.now());
  return {
    groupId,
    adminId,
    qq,
    isAdminToken,
    displayName:
      typeof data.displayName === 'string' && data.displayName.trim()
        ? data.displayName
        : null,
    avatarUrl:
      typeof data.avatarUrl === 'string' && data.avatarUrl.trim()
        ? data.avatarUrl
        : null,
    ttlSeconds: Number.isFinite(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : 600,
    expiresAt:
      Number.isFinite(expiresAt) && expiresAt > 0
        ? expiresAt
        : createdAt + 600 * 1000,
    createdAt
  };
}

export async function getAuth(cookieHeader: string | null): Promise<Auth | null> {
  const sessionToken = parseToken(cookieHeader);
  if (!sessionToken) return null;
  const sessionRaw = await KVService.get(getSessionKey(sessionToken));
  if (!sessionRaw) return null;
  let parsedRaw: unknown;
  try {
    parsedRaw = JSON.parse(sessionRaw);
  } catch {
    return null;
  }
  const session = normalizeSession(parsedRaw);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    await KVService.delete(getSessionKey(sessionToken));
    return null;
  }
  return { sessionToken, ...session };
}

export function requireGroupAccess(auth: Auth | null, groupId: string): boolean {
  if (!auth) return false;
  if (auth.isAdminToken) return true;
  return auth.groupId != null && auth.groupId === groupId;
}

export function requireAdminToken(auth: Auth | null): boolean {
  return !!auth?.isAdminToken;
}
