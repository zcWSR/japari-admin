/**
 * Worker 入口：供 wrangler dev / deploy 使用。
 * 使用 D1/KV 绑定，不走 HTTP；配置从 env（.dev.vars / [vars]）读取。
 */
import './config';
import { setRequestEnv } from './env-store';
import errorCatcher from './middlewares/error-catcher';
import app from './routes';
import PluginService from './services/plugin-service';
import QQService from './services/qq-service';
import logger from './utils/logger';

let pluginsLoaded = false;

// 每次请求注入 env（DB、KV、vars）
app.use('*', async (c, next) => {
  setRequestEnv(c.env);
  try {
    if (!pluginsLoaded) {
      logger.info('loading plugins (first request)');
      await PluginService.loadPlugins();
      pluginsLoaded = true;
      try {
        QQService.sendReadyMessage();
      } catch (_) {}
    }
    await next();
  } finally {
    setRequestEnv(null);
  }
});

app.use('*', errorCatcher);

export default {
  fetch(request, env, ctx) {
    return app.fetch(request, env, ctx);
  }
};
