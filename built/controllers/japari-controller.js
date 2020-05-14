"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _router = require("../decorators/router");
var _botErrorReporter = _interopRequireDefault(require("../middlewares/bot-error-reporter"));
var _pluginService = _interopRequireDefault(require("../services/plugin-service"));
var _qqService = _interopRequireDefault(require("../services/qq-service"));var _dec, _dec2, _dec3, _class, _class2;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _createForOfIteratorHelper(o) {if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) {if (Array.isArray(o) || (o = _unsupportedIterableToArray(o))) {var i = 0;var F = function F() {};return { s: F, n: function n() {if (i >= o.length) return { done: true };return { done: false, value: o[i++] };}, e: function e(_e) {throw _e;}, f: F };}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");}var it,normalCompletion = true,didErr = false,err;return { s: function s() {it = o[Symbol.iterator]();}, n: function n() {var step = it.next();normalCompletion = step.done;return step;}, e: function e(_e2) {didErr = true;err = _e2;}, f: function f() {try {if (!normalCompletion && it.return != null) it.return();} finally {if (didErr) throw err;}} };}function _unsupportedIterableToArray(o, minLen) {if (!o) return;if (typeof o === "string") return _arrayLikeToArray(o, minLen);var n = Object.prototype.toString.call(o).slice(8, -1);if (n === "Object" && o.constructor) n = o.constructor.name;if (n === "Map" || n === "Set") return Array.from(o);if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);}function _arrayLikeToArray(arr, len) {if (len == null || len > arr.length) len = arr.length;for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];return arr2;}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {var desc = {};Object.keys(descriptor).forEach(function (key) {desc[key] = descriptor[key];});desc.enumerable = !!desc.enumerable;desc.configurable = !!desc.configurable;if ('value' in desc || desc.initializer) {desc.writable = true;}desc = decorators.slice().reverse().reduce(function (desc, decorator) {return decorator(target, property, desc) || desc;}, desc);if (context && desc.initializer !== void 0) {desc.value = desc.initializer ? desc.initializer.call(context) : void 0;desc.initializer = undefined;}if (desc.initializer === void 0) {Object.defineProperty(target, property, desc);desc = null;}return desc;}let


JapariController = (_dec = (0, _router.Router)(), _dec2 =
_router.Route.get('/'), _dec3 =




_router.Route.post('/event', _botErrorReporter.default), _dec(_class = (_class2 = class JapariController {main() {return "<h1>ようこそ！ジャパリパークへ！</h1><script>console.log('/japari/event is bot')</script>";}
  allEvent({ request }) {return _asyncToGenerator(function* () {
      const fromBot = request.body;
      const type = _qqService.default.convertMessageType(fromBot);
      const plugins = _pluginService.default.getPlugins(type);
      const config = yield _pluginService.default.getConfig(type, fromBot);
      if (!config) return {};
      // eslint-disable-next-line no-restricted-syntax
      var _iterator = _createForOfIteratorHelper(plugins),_step;try {for (_iterator.s(); !(_step = _iterator.n()).done;) {const plugin = _step.value;
          if (!config[plugin.name]) continue;
          if ((yield plugin.go(fromBot, type)) === 'break') break;
        }} catch (err) {_iterator.e(err);} finally {_iterator.f();}
      return {};})();
  }}, (_applyDecoratedDescriptor(_class2.prototype, "main", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "main"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "allEvent", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "allEvent"), _class2.prototype)), _class2)) || _class);var _default =


JapariController;exports.default = _default;