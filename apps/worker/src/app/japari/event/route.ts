/**
 * POST /japari/event - QQ 事件上报，执行插件链。
 */

import type { NextRequest } from 'next/server';
import PluginService from '@/services/plugin-service';
import QQService from '@/services/qq-service';
import type { IncomingEvent, IPlugin } from '@/types/onebot';
import { notifyAdminsOfError } from '@/utils/notify-admin-error';

export async function POST(request: NextRequest) {
  try {
    const fromBot = (await request.json().catch(() => ({}))) as IncomingEvent;
    const type = QQService.convertMessageType(fromBot);
    if (!type) {
      return Response.json({});
    }
    const plugins = await PluginService.getPlugins(type);
    const config = await PluginService.getConfig(type, fromBot as { group_id: string });
    if (!config) {
      return Response.json({});
    }
    const configMap = config as Record<string, boolean>;
    for (const plugin of plugins) {
      if (!configMap[plugin.name]) continue;
      const result = await (plugin as IPlugin).go?.(fromBot, type);
      if (result === 'break') break;
    }
    return Response.json({});
  } catch (e) {
    notifyAdminsOfError(e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
