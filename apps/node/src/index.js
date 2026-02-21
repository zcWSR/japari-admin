import Koa from 'koa';
import { koaBody } from 'koa-body';

import './config.js';
import errorCatcher from './middlewares/error-catcher.js';
import R2Service from './services/r2-service.js';
import ScheduleService from './services/schedule-service.js';
import router from './routes.js';
import Config from './config.js';
import logger from './utils/logger.js';

const app = new Koa();
app.use(koaBody());
app.use(errorCatcher);
app.use(router.routes());

async function start() {
  try {
    R2Service.init();
    await ScheduleService.refresh();
    app.listen(Config.port);
    logger.info('japari node listening on port %s', Config.port);
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }
}

start();
