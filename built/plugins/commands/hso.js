"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _plugin = require("../../decorators/plugin");
var _hsoService = _interopRequireDefault(require("../../services/hso-service"));
var _qqService = _interopRequireDefault(require("../../services/qq-service"));
var _logger = _interopRequireDefault(require("../../utils/logger"));var _dec, _class;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}let








NewNotice = (_dec = (0, _plugin.Command)({ name: 'hso', command: 'hso', type: 'all', level: 2, info: '好爽哦' }), _dec(_class = class NewNotice {
  sendMessage(msg, body, type) {
    if (type === 'group') {
      _qqService.default.sendGroupMessage(body.group_id, msg);
    }
    if (type === 'private') {
      _qqService.default.sendPrivateMessage(body.user_id, msg);
    }
  }

  getParams(params = '') {
    return params.
    trim().
    split(' ').
    reduce(
    (result, key) => {
      key = key.trim();
      if (result[key] !== undefined) {
        result[key] = true;
      }
      return result;
    },
    { '+': false, '＋': false, newList: false });

  }

  run(params, body, type) {var _this = this;return _asyncToGenerator(function* () {
      try {
        const p = _this.getParams(params);
        const hso = yield _hsoService.default.getOne(p['+'] || p['＋'], p.newList);
        const msg = _hsoService.default.buildMessage(hso);
        _this.sendMessage(msg, body, type);
      } catch (e) {
        _logger.default.error(e.toString());
        _this.sendMessage('色不动了', body, type);
        throw e;
      }})();
  }}) || _class);var _default =


NewNotice;exports.default = _default;