"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _plugin = require("../../decorators/plugin");
var _qqService = _interopRequireDefault(require("../../services/qq-service"));
var _redisService = _interopRequireDefault(require("../../services/redis-service"));var _dec, _class;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _slicedToArray(arr, i) {return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();}function _nonIterableRest() {throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");}function _unsupportedIterableToArray(o, minLen) {if (!o) return;if (typeof o === "string") return _arrayLikeToArray(o, minLen);var n = Object.prototype.toString.call(o).slice(8, -1);if (n === "Object" && o.constructor) n = o.constructor.name;if (n === "Map" || n === "Set") return Array.from(o);if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);}function _arrayLikeToArray(arr, len) {if (len == null || len > arr.length) len = arr.length;for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];return arr2;}function _iterableToArrayLimit(arr, i) {if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i["return"] != null) _i["return"]();} finally {if (_d) throw _e;}}return _arr;}function _arrayWithHoles(arr) {if (Array.isArray(arr)) return arr;}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}let








ReadAgainFollow = (_dec = (0, _plugin.Command)({ name: '设置随机垃圾话及概率', command: 'lj', type: 'group', info: "查看和设置随机垃圾话概率, '!lj'查看当前概率, '!lj 0.x'设置概率", level: 2 }), _dec(_class = class ReadAgainFollow {
  getRateRedisKey(groupId) {
    return `garbage-word-random-${groupId}`;
  }

  getListRedisKey(groupId) {
    return `garbage-word-random-word-list-${groupId}`;
  }

  addGarbageWord(groupId, word) {var _this = this;return _asyncToGenerator(function* () {
      const redisKey = _this.getListRedisKey(groupId);
      yield _redisService.default.redis.lrem(redisKey, 0, word);
      yield _redisService.default.redis.rpush(redisKey, word);
      _qqService.default.sendGroupMessage(groupId, `已添加: ${word}`);})();
  }

  removeGarbageWord(groupId, inputIndex) {var _this2 = this;return _asyncToGenerator(function* () {
      const redisKey = _this2.getListRedisKey(groupId);
      const word = yield _redisService.default.redis.lindex(redisKey, +inputIndex - 1);
      if (!word) {
        _qqService.default.sendGroupMessage(groupId, 'index 不存在');
        return;
      }
      yield _redisService.default.redis.lrem(redisKey, 0, word);
      _qqService.default.sendGroupMessage(groupId, `已移除: ${word}`);})();
  }

  getGarbageWordList(groupId) {var _this3 = this;return _asyncToGenerator(function* () {
      const list = yield _redisService.default.redis.lrange(_this3.getListRedisKey(groupId), 0, -1);
      const listString = list.reduce((result, curr, index) => {
        result += `\n${index + 1}. ${curr}`;
        return result;
      }, '');
      _qqService.default.sendGroupMessage(groupId, `当前垃圾话列表:${listString}`);})();
  }

  getGarbageWordRate(groupId) {var _this4 = this;return _asyncToGenerator(function* () {
      const rate = yield _redisService.default.get(_this4.getRateRedisKey(groupId));
      _qqService.default.sendGroupMessage(
      groupId,
      `当前随机垃圾话概率: ${(rate * 100).toFixed(2)}%`);})();

  }

  setGarbageWordRate(rate, groupId) {var _this5 = this;return _asyncToGenerator(function* () {
      yield _redisService.default.set(_this5.getRateRedisKey(groupId), rate);
      _qqService.default.sendGroupMessage(
      groupId,
      `设置当前垃圾话复读概率为: ${(rate * 100).toFixed(2)}%`);})();

  }

  run(params, body) {var _this6 = this;return _asyncToGenerator(function* () {
      params = params.trim();const
      groupId = body.group_id,userId = body.user_id;
      if (!params) {
        yield _this6.getGarbageWordRate(groupId);
        return;
      }
      const match = params.match(/(add[\t-\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]|remove[\t-\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]|list)([\s\S]*)?/);
      if (match) {const _match = _slicedToArray(
        match, 3),op = _match[1],word = _match[2];
        const operation = op.trim();
        if (operation === 'add') {
          yield _this6.addGarbageWord(groupId, word.trim());
        } else if (operation === 'remove') {
          yield _this6.removeGarbageWord(groupId, word.trim());
        } else if (operation === 'list') {
          yield _this6.getGarbageWordList(groupId);
        }
        return;
      }

      const rate = parseFloat(params);
      if (yield _qqService.default.checkRateWithMessage(rate, groupId, userId)) {
        _this6.setGarbageWordRate(rate, groupId);
      }})();
  }}) || _class);var _default =


ReadAgainFollow;exports.default = _default;