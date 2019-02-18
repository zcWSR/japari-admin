import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import koaBody from 'koa-body';
import Router from 'koa-router';

import { getProcessArgv } from './utils/process';
import errorCatcher from './middlewares/errorCatcher';
import logger from './utils/logger';

import JapariController from './controllers/japari-controller';

function initServer(port) {
  const router = new Router();
  const app = new Koa();
  app.use(bodyParser());
  app.use(koaBody());
  app.use(errorCatcher);
  app.use(router.routes());
  app.use(JapariController.routes());
  app.listen(port);
}


const args = getProcessArgv();
let port = 3000;
if (!args.p && !args.port) {
  logger.warn(`did not find port settings, use default port ${port}`);
} else {
  port = +(args.p || args.port);
  logger.info(`start at port ${port}`);
}


initServer(port);
