import { resolve } from 'path';
import cFonts from 'cfonts';
import Koa from 'koa';
import { koaBody } from 'koa-body';

import './config';
import errorCatcher from './middlewares/error-catcher';
import D1Service from './services/d1-service';
import FileService from './services/file-service';
import KVService from './services/kv-service';
import PluginService from './services/plugin-service';
import QQService from './services/qq-service';
import R2Service from './services/r2-service';
import { isDev } from './utils/env';
import logger from './utils/logger';
import { getProcessArgv } from './utils/process';

function initServer(port) {
  const app = new Koa();
  app.use(koaBody());
  app.use(errorCatcher);
  FileService.getRoutersFromDir(resolve(__dirname, 'controllers'), app);
  app.listen(port);
}

function getPort() {
  const args = getProcessArgv();
  let port = 3000;
  if (!args.p && !args.port) {
    logger.warn(`did not find port settings, use default port ${port}`);
  } else {
    port = +(args.p || args.port);
    logger.info(`start at port ${port}`);
  }
  return port;
}

async function start() {
  try {
    cFonts.say('japari', {
      letterSpacing: 2,
      space: false,
      colors: ['yellow', 'green']
    });
    cFonts.say('admin', {
      letterSpacing: 2,
      space: false,
      colors: ['yellow', 'green']
    });
    isDev() && logger.info('******** now in debug mode ********');
    // 初始化 Cloudflare 服务
    D1Service.init();
    KVService.init();
    R2Service.init();
    await PluginService.loadPlugins();
    initServer(getPort());
    QQService.sendReadyMessage();
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }
}

process.on('error', (error) => logger.error(error));
start();
