'use server';

import { headers } from 'next/headers';
import { getAuth, requireGroupAccess } from '@/lib/auth';
import PluginService from '@/services/plugin-service';

export type GroupConfigResult =
  | {
      config?: Record<string, boolean>;
      plugins?: { name: string; shortInfo: string; enabled: boolean }[];
      isAdminToken?: boolean;
    }
  | { error: string; status: number };

export async function getGroupConfig(groupId: string): Promise<GroupConfigResult> {
  const h = await headers();
  const auth = await getAuth(h.get('cookie'));
  if (!auth) return { error: 'unauthorized', status: 401 };
  if (!requireGroupAccess(auth, groupId)) return { error: 'forbidden', status: 403 };
  const config = await PluginService.getGroupConfig(Number(groupId));
  const { group, notice } = PluginService.plugins;
  const all = [...group, ...notice];
  const configMap = config as Record<string, boolean>;
  const plugins = all.map((p: { name: string; shortInfo?: string }) => ({
    name: p.name,
    shortInfo: p.shortInfo ?? p.name,
    enabled: !!configMap[p.name]
  }));
  return {
    config: configMap,
    plugins,
    isAdminToken: auth.isAdminToken
  };
}

export async function setGroupConfig(
  groupId: string,
  config: Record<string, boolean>
): Promise<{ ok?: boolean; error?: string; status?: number }> {
  const h = await headers();
  const auth = await getAuth(h.get('cookie'));
  if (!auth) return { error: 'unauthorized', status: 401 };
  if (!requireGroupAccess(auth, groupId)) return { error: 'forbidden', status: 403 };
  await PluginService.setGroupConfig(Number(groupId), config as never);
  return { ok: true };
}
