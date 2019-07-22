"use strict";require("core-js/modules/es.promise");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _logger = _interopRequireDefault(require("../utils/logger"));
var _qqService = _interopRequireDefault(require("../services/qq-service"));
var _config = _interopRequireDefault(require("../config"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}var _default = /*#__PURE__*/function () {var _ref = _asyncToGenerator(

  function* (ctx, next) {
    try {
      yield next();
    } catch (e) {
      _logger.default.error(e);
      _config.default.ADMINS.forEach((admin, index) => {
        setTimeout(() => {
          _qqService.default.sendPrivateMessage(admin, `发生错误: \n${e.stack}`);
        }, index ? 3 * 1000 : 0);
      });
    }
  });return function (_x, _x2) {return _ref.apply(this, arguments);};}();exports.default = _default;
//# sourceMappingURL=bot-error-reporter.js.map
