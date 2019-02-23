import { resolve } from 'path';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import koaBody from 'koa-body';

import { getProcessArgv } from './utils/process';
import errorCatcher from './middlewares/error-catcher';
import logger from './utils/logger';
import DBService from './services/db-service';
import { getRoutersFromDir } from './services/file-service';

function initServer(port) {
  const app = new Koa();
  app.use(bodyParser());
  app.use(koaBody());
  app.use(errorCatcher);
  getRoutersFromDir(resolve(__dirname, 'controllers'), app);
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
  const checkDone = await DBService.checkTables();
  if (!checkDone) {
    process.exit(1);
  }
  initServer(getPort());
}

process.on('error', error => logger.error(error));
start();
