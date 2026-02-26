'use server';

import { headers } from 'next/headers';
import { getAuth, requireGroupAccess } from '@/lib/auth';
import PluginService from '@/services/plugin-service';

export type PluginConfigResult =
  | { config: unknown; hasConfig: boolean }
  | { error: string; status: number };

export async function getPluginConfig(
  groupId: string,
  pluginName: string
): Promise<PluginConfigResult> {
  const h = await headers();
  const auth = await getAuth(h.get('cookie'));
  if (!auth) return { error: 'unauthorized', status: 401 };
  if (!requireGroupAccess(auth, groupId)) return { error: 'forbidden', status: 403 };
  const { group, notice } = await PluginService.getGroupAndNoticePlugins();
  const all = [...group, ...notice];
  const plugin = all.find((p: { name: string }) => p.name === pluginName);
  if (!plugin) return { error: 'plugin not found', status: 404 };
  if (
    typeof (plugin as { getPageConfig?: (g: string) => Promise<unknown> }).getPageConfig !==
    'function'
  ) {
    return { config: null, hasConfig: false };
  }
  const pageConfig = await (
    plugin as unknown as { getPageConfig: (g: string) => Promise<unknown> }
  ).getPageConfig(groupId);
  return (
    pageConfig != null ? pageConfig : { config: null, hasConfig: false }
  ) as PluginConfigResult;
}

export async function setPluginConfig(
  groupId: string,
  pluginName: string,
  body: Record<string, unknown>
): Promise<{ ok?: boolean; error?: string; status?: number }> {
  const h = await headers();
  const auth = await getAuth(h.get('cookie'));
  if (!auth) return { error: 'unauthorized', status: 401 };
  if (!requireGroupAccess(auth, groupId)) return { error: 'forbidden', status: 403 };
  const { group, notice } = await PluginService.getGroupAndNoticePlugins();
  const all = [...group, ...notice];
  const plugin = all.find((p: { name: string }) => p.name === pluginName);
  if (!plugin) return { error: 'plugin not found', status: 404 };
  if (
    typeof (
      plugin as {
        setPageConfig?: (g: string, b: Record<string, unknown>) => Promise<void>;
      }
    ).setPageConfig !== 'function'
  ) {
    return { error: 'plugin does not support setPageConfig', status: 400 };
  }
  await (
    plugin as unknown as {
      setPageConfig: (g: string, b: Record<string, unknown>) => Promise<void>;
    }
  ).setPageConfig(groupId, body);
  return { ok: true };
}
