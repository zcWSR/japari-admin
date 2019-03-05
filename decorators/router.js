import KoaRouter from 'koa-router';
import logger from '../utils/logger';

export const Router = config => target => class extends target {
  constructor(prefix) {
    const instance = super(prefix);
    this.prefix = prefix === '/' ? null : prefix;
    this.router = new KoaRouter({ prefix, ...config });
    const targetMethods = Object.getOwnPropertyDescriptors(target.prototype);
    Object.keys(targetMethods).forEach((name) => {
      const method = targetMethods[name];
      if (name === 'constructor' || typeof method.value !== 'function') return;
      instance[name](this.router);
    });
  }

  mount() {
    logger.debug(`=== router${this.prefix ? ` '${this.prefix}'` : ''} loaded ===`);
    return this.router.routes();
  }
};

const methods = ['get', 'post', 'put', 'delete', 'options', 'head', 'patch'];
export const Route = methods.reduce((prev, method) => {
  prev[method] = (url, ...middlewares) => (target, name, descriptor) => {
    const fn = descriptor.value;
    // eslint-disable-next-line space-before-function-paren
    descriptor.value = function value() {
      const userLogic = async (ctx, next) => {
        const res = await fn(ctx, next);
        if (res !== undefined) {
          ctx.body = res;
        }
      };
      this.router[method](url, ...[...middlewares || [], userLogic]);
      logger.debug(`route [${method.toUpperCase()}] '${this.prefix || ''}${url}' loaded`);
    };
    return descriptor;
  };
  return prev;
}, {});
