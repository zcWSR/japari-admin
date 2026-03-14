'use server';

import { cookies, headers } from 'next/headers';
import Config from '@/config';
import { acquireGroupLockWithSession, releaseGroupLock } from '@/actions/group-lock';
import {
  COOKIE_TOKEN_NAME,
  getAvatarUrl,
  getAuth,
  getSessionKey,
  type AuthSession
} from '@/lib/auth';
import KVService from '@/services/kv-service';
import QQService from '@/services/qq-service';

type VerifyResult =
  | { ok: true; redirectTo: string; ttlSeconds: number; expiresAt: number }
  | { ok: false; error: 'invalid_input' | 'member_not_found' | 'insufficient_role' | 'busy' | 'service_error' };

function isDigits(value: string): boolean {
  return /^\d+$/.test(value);
}

function roleAllowed(role: string | undefined): boolean {
  return role === 'admin' || role === 'owner';
}

async function createSession(payload: AuthSession): Promise<string | null> {
  const sessionToken = crypto.randomUUID();
  const ok = await KVService.setJSON(getSessionKey(sessionToken), payload, payload.ttlSeconds);
  return ok ? sessionToken : null;
}

export async function verifySettingAccess(input: {
  groupId?: string;
  qq?: string;
}): Promise<VerifyResult> {
  const qq = String(input.qq ?? '').trim();
  const groupId = String(input.groupId ?? '').trim();
  if (!isDigits(qq)) {
    return { ok: false, error: 'invalid_input' };
  }

  const isAdmin = Config.ADMINS.includes(Number(qq));
  if (!isAdmin && !isDigits(groupId)) {
    return { ok: false, error: 'invalid_input' };
  }
  if (!isAdmin && !groupId) {
    return { ok: false, error: 'invalid_input' };
  }

  let memberName: string | null = null;
  const resolvedGroupId: string | null = isAdmin && !groupId ? null : groupId;

  if (resolvedGroupId) {
    const member = await QQService.getGroupMemberInfo(Number(resolvedGroupId), Number(qq)).catch(
      () => null
    );
    if (!member) {
      return { ok: false, error: 'member_not_found' };
    }
    if (!roleAllowed(member.role)) {
      return { ok: false, error: 'insufficient_role' };
    }
    memberName = member.card || member.nickname || qq;
  }

  const ttlSeconds = isAdmin ? Config.MANAGE_SESSION_TTL_ADMIN : Config.MANAGE_SESSION_TTL_NORMAL;
  const now = Date.now();
  const expiresAt = now + ttlSeconds * 1000;
  const sessionToken = await createSession({
    groupId: resolvedGroupId,
    adminId: qq,
    qq,
    isAdminToken: isAdmin,
    displayName: memberName ?? (isAdmin ? '超管' : qq),
    avatarUrl: getAvatarUrl(qq),
    ttlSeconds,
    expiresAt,
    createdAt: now
  });
  if (!sessionToken) {
    return { ok: false, error: 'service_error' };
  }

  if (resolvedGroupId) {
    const lockResult = await acquireGroupLockWithSession({
      groupId: resolvedGroupId,
      holderSessionId: sessionToken,
      holderQq: qq,
      holderName: memberName ?? (isAdmin ? '超管' : qq)
    });
    if ('error' in lockResult) {
      await KVService.delete(getSessionKey(sessionToken));
      if (lockResult.error === 'busy') return { ok: false, error: 'busy' };
      return { ok: false, error: 'service_error' };
    }
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_TOKEN_NAME, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: ttlSeconds
  });

  return {
    ok: true,
    redirectTo: isAdmin ? '/manage/group/op' : `/manage/group/${resolvedGroupId}`,
    ttlSeconds,
    expiresAt
  };
}

export async function logout(): Promise<{ ok: true }> {
  const h = await headers();
  const auth = await getAuth(h.get('cookie'));
  if (auth?.groupId) {
    await releaseGroupLock(auth.groupId);
  }
  if (auth) {
    await KVService.delete(getSessionKey(auth.sessionToken));
  }
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_TOKEN_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 0
  });
  return { ok: true };
}

export async function getSessionInfo():
  Promise<
    | {
        qq: string;
        displayName: string | null;
        avatarUrl: string | null;
        isAdminToken: boolean;
        groupId: string | null;
        expiresAt: number;
        ttlSeconds: number;
        remainingSeconds: number;
      }
    | { error: 'unauthorized'; status: 401 }
  > {
  const h = await headers();
  const auth = await getAuth(h.get('cookie'));
  if (!auth) return { error: 'unauthorized', status: 401 };

  const remainingSeconds = Math.max(0, Math.floor((auth.expiresAt - Date.now()) / 1000));
  return {
    qq: auth.qq,
    displayName: auth.displayName,
    avatarUrl: auth.avatarUrl,
    isAdminToken: auth.isAdminToken,
    groupId: auth.groupId,
    expiresAt: auth.expiresAt,
    ttlSeconds: auth.ttlSeconds,
    remainingSeconds
  };
}
