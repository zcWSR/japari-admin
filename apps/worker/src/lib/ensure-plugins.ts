/**
 * 首次需要时加载插件；Config/KV/D1 等已用 getCloudflareContext().env，无需额外注入。
 */
import PluginService from '@/services/plugin-service.js';
import QQService from '@/services/qq-service.js';
import logger from '@/utils/logger.js';

let pluginsLoaded = false;

export async function ensurePluginsLoaded(): Promise<void> {
  if (pluginsLoaded) return;
  logger.info('loading plugins (first request)');
  await PluginService.loadPlugins();
  pluginsLoaded = true;
  try {
    QQService.sendReadyMessage();
  } catch {
    // ignore
  }
}
