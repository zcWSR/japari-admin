import KoaRouter from 'koa-router';

export const Router = (config) => {
  const router = new KoaRouter(config);
  return (target) => {
    const targetMethods = Object.getOwnPropertyDescriptors(target.prototype);
    Object.keys(targetMethods).forEach((name) => {
      if (name === 'constructor') return;
      targetMethods[name].value(router);
    });
    return router;
  };
};

const methods = ['get', 'post', 'put', 'delete', 'options', 'head', 'patch'];
export const Route = {};
methods.forEach((method) => {
  Route[method] = (url, middlewares) => (target, name, descriptor) => {
    const fn = descriptor.value;
    descriptor.value = (router) => {
      const route = async (ctx, next) => {
        const res = await fn(ctx, next);
        if (res !== undefined) {
          ctx.body = res;
        }
      };
      if (middlewares) {
        router[method](url, middlewares, route);
      } else {
        router[method](url, route);
      }
    };
  };
});

export default {
  Router,
  Route
};
