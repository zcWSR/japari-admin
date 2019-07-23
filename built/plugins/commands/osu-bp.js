"use strict";require("core-js/modules/es.promise");require("core-js/modules/es.string.replace");require("core-js/modules/es.string.split");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _plugin = require("../../decorators/plugin");
var _qqService = _interopRequireDefault(require("../../services/qq-service"));
var _osuService = _interopRequireDefault(require("../../services/osu-service"));var _dec, _class;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}let









OSUBp = (_dec = (0, _plugin.Command)({ name: '查询osu! bp', command: 'bp', type: 'group', info: `查询某特定账号的bp数据, '!bp 玩家名,第几bp,mode'来调用
  第几bp不传默认为第一bp, mode不写默认为osu!模式
  模式代码: (0 = osu!, 1 = Taiko, 2 = CtB, 3 = osu!mania)` }), _dec(_class = class OSUBp {run(params, body) {return _asyncToGenerator(function* () {const groupId = body.group_id;
      if (!params) {
        _qqService.default.sendGroupMessage(groupId, "缺少查询参数, 使用'!help bp'查看调用方式");
        return;
      }
      params = params.replace('，', ',');
      params = params.split(',');
      const osuName = params[0];
      if (!osuName) {
        _qqService.default.sendGroupMessage(groupId, '非法参数, 请输入玩家昵称');
        return;
      }
      const bpIndex = parseInt(params[1] || 1, 10);
      if (bpIndex > 20 || bpIndex < 0) {
        _qqService.default.sendGroupMessage(groupId, '非法参数, 仅支持bp查询范围#1-#20, 请重试');
        return;
      }
      const mode = parseInt(params[2] || 0, 10);
      if (mode !== 0 && mode !== 2 && mode !== 1 && mode !== 3) {
        _qqService.default.sendGroupMessage(groupId, '非法参数, 请不要写不存在的模式谢谢');
        return;
      }
      const userInfo = yield _osuService.default.getInstance().getUserByName(osuName, mode);
      if (typeof userInfo === 'string') {
        _qqService.default.sendGroupMessage(groupId, userInfo);
        return;
      }
      const bpInfo = yield _osuService.default.getInstance().getBP(
      {
        osuName: userInfo.username,
        osuId: +userInfo.user_id,
        mode },

      bpIndex);

      if (typeof bpInfo === 'string') {
        _qqService.default.sendGroupMessage(groupId, bpInfo);
        return;
      }
      yield _osuService.default.getInstance().sendInfo(`bp#${bpIndex}`, bpInfo, groupId);})();
  }}) || _class);var _default =


OSUBp;exports.default = _default;