'use server';

import { headers } from 'next/headers';
import { getAuth, requireGroupAccess } from '@/lib/auth';
import { ensurePluginsLoaded } from '@/lib/ensure-plugins';
import PluginService from '@/services/plugin-service.js';

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
  await ensurePluginsLoaded();
  const config = await PluginService.getGroupConfig(groupId);
  const { group, notice } = PluginService.plugins;
  const all = [...group, ...notice];
  const plugins = all.map((p: { name: string; shortInfo?: string }) => ({
    name: p.name,
    shortInfo: p.shortInfo ?? p.name,
    enabled: !!config[p.name]
  }));
  return {
    config,
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
  await PluginService.setGroupConfig(groupId, config);
  return { ok: true };
}
