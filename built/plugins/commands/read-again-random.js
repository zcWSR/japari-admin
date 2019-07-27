"use strict";require("core-js/modules/es.promise");require("core-js/modules/es.string.trim");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _plugin = require("../../decorators/plugin");
var _qqService = _interopRequireDefault(require("../../services/qq-service"));
var _redisService = _interopRequireDefault(require("../../services/redis-service"));var _dec, _class;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}let








ReadAgainFollow = (_dec = (0, _plugin.Command)({ name: '设计随机复读概率', command: 'fd', type: 'group', info: "查看和设置随机复读概率, '!fd'查看当前概率, '!fd 0.x'设置概率", level: 2 }), _dec(_class = class ReadAgainFollow {
  getRedisKey(groupId) {
    return `read-again-random-${groupId}`;
  }

  getReadAgainRate(groupId) {var _this = this;return _asyncToGenerator(function* () {
      const rate = yield _redisService.default.get(_this.getRedisKey(groupId));
      _qqService.default.sendGroupMessage(groupId, `当前随机复读概率: ${(rate * 100).toFixed(2)}%`);})();
  }

  setReadAgainRate(rate, groupId) {var _this2 = this;return _asyncToGenerator(function* () {
      yield _redisService.default.set(_this2.getRedisKey(groupId), rate);
      _qqService.default.sendGroupMessage(groupId, `设置当前随机复读概率为: ${(rate * 100).toFixed(2)}%`);})();
  }

  run(params, body) {var _this3 = this;return _asyncToGenerator(function* () {
      params = params.trim();const
      groupId = body.group_id,userId = body.user_id;
      if (!params) {
        yield _this3.getReadAgainRate(groupId);
        return;
      }
      const rate = parseFloat(params);
      if (Number.isNaN(rate)) {
        _qqService.default.sendGroupMessage(groupId, '参数非法');
        return;
      }
      if (rate >= 1) {
        _qqService.default.sendGroupMessage(groupId, '不可设置大于100%的值');
        return;
      }
      if (rate >= 0.5) {
        if (yield _qqService.default.isGroupOwner(groupId, userId)) {
          _this3.setReadAgainRate(rate, groupId);
        } else {
          _qqService.default.sendGroupMessage(groupId, '由于设置概率为50%及以上极有可能造成性能影响, 仅群主拥有权限');
        }
        return;
      }
      _this3.setReadAgainRate(rate, groupId);})();
  }}) || _class);var _default =


ReadAgainFollow;exports.default = _default;