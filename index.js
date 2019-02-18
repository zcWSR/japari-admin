import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import koaBody from 'koa-body';
import Router from 'koa-router';

import { getProcessArgv } from './utils/process';


function initServer(port) {
  const router = new Router();

  const app = new Koa();
  app.use(bodyParser());
  app.use(koaBody());
  app.use(router.routes());
  app.listen(port);
}

const args = getProcessArgv();
let port = 3000;
if (!args.p && !args.port) {
  console.warn(`did not find port settings, use default port ${port}`);
} else {
  port = +(args.p || args.port);
  console.log(`use port ${port}`);
}


initServer(port);
