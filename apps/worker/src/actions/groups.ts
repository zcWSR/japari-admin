'use server';

import { headers } from 'next/headers';
import { getAuth, requireAdminToken } from '@/lib/auth';
import PluginService from '@/services/plugin-service';

export type GroupsResult = { groups: { groupId: string }[] } | { error: string; status: number };

export async function getGroups(): Promise<GroupsResult> {
  const h = await headers();
  const auth = await getAuth(h.get('cookie'));
  if (!requireAdminToken(auth)) {
    return { error: 'forbidden', status: 403 };
  }
  const groupIds = await PluginService.getAllGroupIds();
  return { groups: groupIds.map((groupId) => ({ groupId })) };
}

/** 超管删除群配置（从 KV 移除，群将不再出现在列表中） */
export async function deleteGroupConfig(
  groupId: string
): Promise<{ ok?: boolean; error?: string; status?: number }> {
  const h = await headers();
  const auth = await getAuth(h.get('cookie'));
  if (!requireAdminToken(auth)) {
    return { error: 'forbidden', status: 403 };
  }
  if (!/^\d+$/.test(groupId)) return { error: 'invalid', status: 400 };
  const ok = await PluginService.deleteGroupConfig(groupId);
  return ok ? { ok: true } : { error: 'delete_failed', status: 500 };
}
