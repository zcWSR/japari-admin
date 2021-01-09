"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _plugin = require("../../decorators/plugin");
var _qqService = _interopRequireDefault(require("../../services/qq-service"));
var _osuService = _interopRequireDefault(require("../../services/osu-service"));var _dec, _class;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}let







OSUUnbind = (_dec = (0, _plugin.Command)({ name: '解绑osu!账号', command: 'unbind', type: 'group', info: "解除osu!账号绑定, '!unbind'来调用" }), _dec(_class = class OSUUnbind {
  run(params, body) {return _asyncToGenerator(function* () {const
      groupId = body.group_id,userId = body.user_id;
      const message = yield _osuService.default.getInstance().unBindOSUId(groupId, userId);
      _qqService.default.sendGroupMessage(groupId, message);})();
  }}) || _class);var _default =


OSUUnbind;exports.default = _default;