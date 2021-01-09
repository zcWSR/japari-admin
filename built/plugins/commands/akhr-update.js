"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _plugin = require("../../decorators/plugin");
var _qqService = _interopRequireDefault(require("../../services/qq-service"));
var _akhrService = _interopRequireDefault(require("../../services/akhr-service"));
var _logger = _interopRequireDefault(require("../../utils/logger"));var _dec, _class;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}let








AkhrUpdate = (_dec = (0, _plugin.Command)({ name: '更新明日方舟公招干员数据', command: 'akhrUpdate', type: 'all', info: '更新明日方舟公招干员数据, 参数为数据源地址', level: 3 }), _dec(_class = class AkhrUpdate {
  sendMsg(body, type, msg) {
    if (type === 'group') {
      _qqService.default.sendGroupMessage(body.group_id, msg);
    } else if (type === 'private') {
      _qqService.default.sendPrivateMessage(body.user_id, msg);
    }
  }

  run(params, body, type) {var _this = this;return _asyncToGenerator(function* () {
      try {
        yield _akhrService.default.updateAkhrList(params);
        _this.sendMsg(body, type, '公招数据已更新');
      } catch (e) {
        _this.sendMsg(body, type, `公招数据更新出错, ${e.customErrorMsg || '未知错误'}`);
        _logger.default.error('update akhr origin list error');
        throw e;
      }})();
  }}) || _class);var _default =


AkhrUpdate;exports.default = _default;