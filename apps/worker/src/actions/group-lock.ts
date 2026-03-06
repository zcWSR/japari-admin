'use server';

import { headers } from 'next/headers';
import { getAuth, requireGroupAccess } from '@/lib/auth';
import KVService from '@/services/kv-service';

const LOCK_PREFIX = 'manage-lock:';
const LOCK_TTL_SECONDS = 60;

type LockValue = {
  holderSessionId: string;
  holderQq: string;
  holderName: string | null;
  updatedAt: number;
};

function lockKey(groupId: string): string {
  return `${LOCK_PREFIX}${groupId}`;
}

function isValidGroupId(groupId: string): boolean {
  return /^\d+$/.test(groupId);
}

export async function acquireGroupLockWithSession(input: {
  groupId: string;
  holderSessionId: string;
  holderQq: string;
  holderName: string | null;
}): Promise<{ ok?: boolean; error?: string; status?: number }> {
  const { groupId, holderSessionId, holderQq, holderName } = input;
  if (!isValidGroupId(groupId)) return { error: 'invalid_group', status: 400 };
  const key = lockKey(groupId);
  const current = await KVService.getJSON<LockValue>(key);
  if (current && current.holderSessionId !== holderSessionId && current.holderQq !== holderQq) {
    return { error: 'busy', status: 409 };
  }
  const ok = await KVService.setJSON(
    key,
    {
      holderSessionId,
      holderQq,
      holderName,
      updatedAt: Date.now()
    } satisfies LockValue,
    LOCK_TTL_SECONDS
  );
  if (!ok) return { error: 'service_error', status: 500 };
  return { ok: true };
}

export async function acquireGroupLock(
  groupId: string
): Promise<{ ok?: boolean; error?: string; status?: number }> {
  if (!isValidGroupId(groupId)) return { error: 'invalid_group', status: 400 };
  const h = await headers();
  const auth = await getAuth(h.get('cookie'));
  if (!auth) return { error: 'unauthorized', status: 401 };
  if (!requireGroupAccess(auth, groupId)) return { error: 'forbidden', status: 403 };

  return acquireGroupLockWithSession({
    groupId,
    holderSessionId: auth.sessionToken,
    holderQq: auth.qq,
    holderName: auth.displayName
  });
}

export async function heartbeatGroupLock(
  groupId: string
): Promise<{ ok?: boolean; error?: string; status?: number }> {
  if (!isValidGroupId(groupId)) return { error: 'invalid_group', status: 400 };
  const h = await headers();
  const auth = await getAuth(h.get('cookie'));
  if (!auth) return { error: 'unauthorized', status: 401 };
  if (!requireGroupAccess(auth, groupId)) return { error: 'forbidden', status: 403 };

  const key = lockKey(groupId);
  const current = await KVService.getJSON<LockValue>(key);
  if (!current) {
    return acquireGroupLock(groupId);
  }
  if (current.holderSessionId !== auth.sessionToken) {
    return { error: 'busy', status: 409 };
  }
  const ok = await KVService.setJSON(
    key,
    {
      ...current,
      holderName: auth.displayName,
      updatedAt: Date.now()
    } satisfies LockValue,
    LOCK_TTL_SECONDS
  );
  if (!ok) return { error: 'service_error', status: 500 };
  return { ok: true };
}

export async function releaseGroupLock(
  groupId: string
): Promise<{ ok?: boolean; error?: string; status?: number }> {
  if (!isValidGroupId(groupId)) return { error: 'invalid_group', status: 400 };
  const h = await headers();
  const auth = await getAuth(h.get('cookie'));
  if (!auth) return { ok: true };

  const key = lockKey(groupId);
  const current = await KVService.getJSON<LockValue>(key);
  if (!current || current.holderSessionId !== auth.sessionToken) {
    return { ok: true };
  }
  const ok = await KVService.delete(key);
  return ok ? { ok: true } : { error: 'service_error', status: 500 };
}
