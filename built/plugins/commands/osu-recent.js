"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _plugin = require("../../decorators/plugin");
var _qqService = _interopRequireDefault(require("../../services/qq-service"));
var _osuService = _interopRequireDefault(require("../../services/osu-service"));var _dec, _class;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}let








OSURecent = (_dec = (0, _plugin.Command)({ name: 'osu绑定账号', command: 'recent', type: 'group', info: `查看所绑定账号的最近一次游玩记录, '!recent 最近的第几次'来调用, 第几次不传默认为最近一次
  例子: '!recent 2' 或 '!recent` }), _dec(_class = class OSURecent {run(params, body) {return _asyncToGenerator(function* () {const
      groupId = body.group_id,userId = body.user_id;
      params = (params || '1').trim();
      const index = parseInt(params, 10);
      if (!index) {
        _qqService.default.sendGroupMessage(groupId, `非法参数'${params}', 使用'!help recent'查看使用方法'`);
        return;
      }
      if (index > 20 || index < 1) {
        _qqService.default.sendGroupMessage(groupId, '仅支持recent查询范围#1-#20, 请重试');
        return;
      }
      const bindUserInfo = yield _osuService.default.getInstance().getBoundInfo(groupId, userId);
      if (!bindUserInfo) {
        _qqService.default.sendGroupMessage(groupId, '您未绑定osu!账号, 使用\'!bind\'进行账号绑定');
        return;
      }
      const info = yield _osuService.default.getInstance().getRecent(bindUserInfo, index);
      if (typeof info === 'string') {
        _qqService.default.sendGroupMessage(groupId, info);
        return;
      }
      yield _osuService.default.getInstance().sendInfo(`recent#${index}`, info, groupId);})();
  }}) || _class);var _default =


OSURecent;exports.default = _default;