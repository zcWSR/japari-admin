/**
 * POST /japari/event - QQ 事件上报，执行插件链。
 */
import type { NextRequest } from 'next/server';
import { ensurePluginsLoaded } from '@/lib/ensure-plugins';
import PluginService from '@/services/plugin-service.js';
import QQService from '@/services/qq-service.js';
import { notifyAdminsOfError } from '@/utils/notify-admin-error.js';

export async function POST(request: NextRequest) {
  try {
    await ensurePluginsLoaded();
    const fromBot = await request.json().catch(() => ({}));
    const type = QQService.convertMessageType(fromBot);
    const plugins = PluginService.getPlugins(type);
    const config = await PluginService.getConfig(type, fromBot);
    if (!config) {
      return Response.json({});
    }
    for (const plugin of plugins) {
      // @ts-expect-error
      if (!config[plugin.name]) continue;
      // @ts-expect-error
      const result = await plugin.go(fromBot, type);
      if (result === 'break') break;
    }
    return Response.json({});
  } catch (e) {
    notifyAdminsOfError(e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
