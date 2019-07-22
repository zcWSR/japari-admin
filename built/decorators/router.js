"use strict";require("core-js/modules/es.array.filter");require("core-js/modules/es.array.iterator");require("core-js/modules/es.object.get-own-property-descriptors");require("core-js/modules/es.promise");Object.defineProperty(exports, "__esModule", { value: true });exports.Route = exports.Router = void 0;var _koaRouter = _interopRequireDefault(require("koa-router"));
var _logger = _interopRequireDefault(require("../utils/logger"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {var symbols = Object.getOwnPropertySymbols(object);if (enumerableOnly) symbols = symbols.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});keys.push.apply(keys, symbols);}return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i] != null ? arguments[i] : {};if (i % 2) {ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

const Router = config => target => class extends target {
  constructor(prefix) {
    const instance = super(prefix);
    this.prefix = prefix === '/' ? null : prefix;
    this.router = new _koaRouter.default(_objectSpread({ prefix }, config));
    const targetMethods = Object.getOwnPropertyDescriptors(target.prototype);
    Object.keys(targetMethods).forEach(name => {
      const method = targetMethods[name];
      if (name === 'constructor' || typeof method.value !== 'function') return;
      instance[name](this.router);
    });
  }

  mount() {
    _logger.default.debug(`=== router${this.prefix ? ` '${this.prefix}'` : ''} loaded ===`);
    return this.router.routes();
  }};exports.Router = Router;


const methods = ['get', 'post', 'put', 'delete', 'options', 'head', 'patch'];
const Route = methods.reduce((prev, method) => {
  prev[method] = (url, ...middlewares) => (target, name, descriptor) => {
    const fn = descriptor.value;
    // eslint-disable-next-line space-before-function-paren
    descriptor.value = function value() {
      const userLogic = /*#__PURE__*/function () {var _ref = _asyncToGenerator(function* (ctx, next) {
          const res = yield fn(ctx, next);
          if (res !== undefined) {
            ctx.body = res;
          }
        });return function userLogic(_x, _x2) {return _ref.apply(this, arguments);};}();
      this.router[method](url, ...[...(middlewares || []), userLogic]);
      _logger.default.debug(`route [${method.toUpperCase()}] '${this.prefix || ''}${url}' loaded`);
    };
    return descriptor;
  };
  return prev;
}, {});exports.Route = Route;
//# sourceMappingURL=router.js.map
