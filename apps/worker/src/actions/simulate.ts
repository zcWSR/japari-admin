'use server';

import { headers } from 'next/headers';
import { getAuth, requireAdminToken } from '@/lib/auth';
import PluginService from '@/services/plugin-service';
import QQService from '@/services/qq-service';
import type { IncomingEvent, PluginPostType } from '@/types/onebot';
import type { MessageInput } from '@/utils/message';
import { formatForLog } from '@/utils/message';

export type SentItem = { type: 'group' | 'private'; id: string; messagePreview: string };

export type SimulateResult =
  | { ok: boolean; results?: unknown[]; sent?: SentItem[] }
  | { error: string; status: number };

export async function simulateMessage(body: {
  group_id?: string;
  user_id?: string;
  message?: string;
  [k: string]: unknown;
}): Promise<SimulateResult> {
  const h = await headers();
  const auth = await getAuth(h.get('cookie'));
  if (!requireAdminToken(auth)) {
    return { error: 'forbidden', status: 403 };
  }
  QQService.startCapture();
  const event = body as unknown as IncomingEvent;
  const type = QQService.convertMessageType(event) as PluginPostType;
  const plugins = await PluginService.getPlugins(type);
  const groupId = body?.group_id != null ? Number(body.group_id) || body.group_id : undefined;
  const config = groupId != null ? await PluginService.getGroupConfig(Number(groupId)) : null;
  const results: unknown[] = [];
  let captured: { type: string; id: string; message: unknown }[] = [];
  try {
    for (const plugin of plugins) {
      if (config && !(config as Record<string, boolean>)[plugin.name]) continue;
      try {
        const result = await (
          plugin as unknown as { go: (b: IncomingEvent, t: PluginPostType) => Promise<unknown> }
        ).go(event, type);
        results.push({ plugin: plugin.name, result });
        if (result === 'break') break;
      } catch (e) {
        results.push({
          plugin: plugin.name,
          error: String((e as Error)?.message || e)
        });
      }
    }
  } finally {
    captured = QQService.getCapturedAndClear();
  }
  const sent: SentItem[] = captured.map(({ type, id, message }) => ({
    type: type as 'group' | 'private',
    id,
    messagePreview: formatForLog(message as MessageInput)
  }));
  return { ok: true, results, sent };
}
