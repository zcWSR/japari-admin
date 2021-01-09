"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _plugin = require("../decorators/plugin");
var _qqService = _interopRequireDefault(require("../services/qq-service"));
var _redisService = _interopRequireDefault(require("../services/redis-service"));
var _process = require("../utils/process");
var _logger = _interopRequireDefault(require("../utils/logger"));var _dec, _class;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}

const DEFAULT_GARBAGE_WORD_LIST = [
'确实',
'你在教我做事?',
'他急了他急了',
'就这?',
'呐',
'呐呐呐',
'不会吧?',
'不会吧不会吧?'];

// 默认频率 1.14514%
const DEFAULT_RATE = 0.0114514 * Math.ceil(DEFAULT_GARBAGE_WORD_LIST.length / 3);let









GarbageWordRandom = (_dec = (0, _plugin.Plugin)({ name: 'garbage-word-random', weight: 96, type: 'group', shortInfo: '垃圾话', info: '随机回复垃圾话', mute: true }), _dec(_class = class GarbageWordRandom {
  getWordListRedisKey(groupId) {
    return `${this.name}-word-list-${groupId}`;
  }

  go(body) {var _this = this;return _asyncToGenerator(function* () {const
      groupId = body.group_id;
      const randomRate = Math.random();
      const groupRate = yield _this.getGroupRandomRate(groupId);
      if (randomRate < groupRate) {
        const word = yield _this.getGarbageWord(groupId);
        _logger.default.info(`group ${groupId}, send garbage: '${word}'`);
        yield (0, _process.sleep)();
        _qqService.default.sendGroupMessage(groupId, word);
        return 'block';
      }
      return null;})();
  }

  getGroupRandomRate(groupId) {var _this2 = this;return _asyncToGenerator(function* () {
      let randomRate = yield _redisService.default.get(`${_this2.name}-${groupId}`);
      if (!randomRate) {
        randomRate = DEFAULT_RATE;
        _this2.setGroupRandomRate(groupId, DEFAULT_RATE);
      }
      return +randomRate;})();
  }

  setGroupRandomRate(groupId, rate) {
    return _redisService.default.set(`${this.name}-${groupId}`, rate);
  }

  getGarbageWord(groupId) {var _this3 = this;return _asyncToGenerator(function* () {
      const redisKey = _this3.getWordListRedisKey(groupId);
      const length = yield _redisService.default.redis.llen(redisKey);
      if (length === 0) {
        const list = DEFAULT_GARBAGE_WORD_LIST;
        yield _redisService.default.redis.rpush(redisKey, list);
        return list[Math.floor(Math.random() * list.length)];
      }
      const wordIndex = Math.floor(Math.random() * length);
      return _redisService.default.redis.lindex(redisKey, wordIndex);})();
  }}) || _class);var _default =


GarbageWordRandom;exports.default = _default;