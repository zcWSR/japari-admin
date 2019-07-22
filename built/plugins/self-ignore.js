"use strict";require("core-js/modules/es.promise");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _plugin = require("../decorators/plugin");
var _config = _interopRequireDefault(require("../config"));var _dec, _class;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}let











SelfIgnore = (_dec = (0, _plugin.Plugin)({ name: 'self-ignore', weight: Number.POSITIVE_INFINITY, type: 'message', shortInfo: '防死循环', info: '防止出现发送消息后, 又被自己读取到造成死循环的情况', default: true, mute: true, hide: true }), _dec(_class = class SelfIgnore {
  go(body) {return _asyncToGenerator(function* () {
      if (body.user_id === _config.default.BOT_QQ_ID) {
        return 'break';
      }})();
  }}) || _class);var _default =


SelfIgnore;exports.default = _default;
//# sourceMappingURL=self-ignore.js.map
