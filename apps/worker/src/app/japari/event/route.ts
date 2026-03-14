/**
 * POST /japari/event - QQ 事件上报，执行插件链。
 */

import type { NextRequest } from 'next/server';
import type { IncomingEvent } from '@/decorators/types';
import PluginService from '@/services/plugin-service';
import QQService from '@/services/qq-service';
import { notifyAdminsOfError } from '@/utils/notify-admin-error';

export async function POST(request: NextRequest) {
  try {
    const fromBot = (await request.json().catch(() => ({}))) as IncomingEvent;
    const type = QQService.convertMessageType(fromBot);
    if (!type) {
      return Response.json({});
    }
    const plugins = await PluginService.getPlugins(type);
    const configMap = await PluginService.getConfig(type, fromBot as { group_id?: number });
    if (!configMap) {
      return Response.json({});
    }
    for (const plugin of plugins) {
      if (!configMap[plugin.name]) continue;
      const result = await plugin.go(fromBot);
      if (result === 'break') break;
    }
    return Response.json({});
  } catch (e) {
    notifyAdminsOfError(e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
