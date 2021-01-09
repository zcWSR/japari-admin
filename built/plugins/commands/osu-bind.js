"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _plugin = require("../../decorators/plugin");
var _qqService = _interopRequireDefault(require("../../services/qq-service"));
var _osuService = _interopRequireDefault(require("../../services/osu-service"));var _dec, _class;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}let










OSUBind = (_dec = (0, _plugin.Command)({ name: 'osu绑定账号', command: 'bind', type: 'group', info: `绑定osu!账号和mode, 使用'!bind 你的id,mode'来调用
  mode不写默认为osu!模式
  模式代码: (0 = osu!, 1 = Taiko, 2 = CtB, 3 = osu!mania)
  例子: !bind zcWSR,3` }), _dec(_class = class OSUBind {run(params, body) {return _asyncToGenerator(function* () {const groupId = body.group_id,userId = body.user_id;if (!params) {
        _qqService.default.sendGroupMessage(groupId, '非法调用, 使用\'!help bind\'查看调用方式');
        return;
      }
      params = params.replace('，', ','); // 处理全角逗号
      params = params.split(',');
      const osuName = params[0];
      const mode = params[1] ? parseInt(params[1], 10) || 0 : 0;
      const message = yield _osuService.default.getInstance().bindOSUId(groupId, userId, osuName, mode);
      _qqService.default.sendGroupMessage(groupId, message);})();
  }}) || _class);var _default =


OSUBind;exports.default = _default;