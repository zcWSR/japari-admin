"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _plugin = require("../decorators/plugin");

var _qqService = _interopRequireDefault(require("../services/qq-service"));
var _redisService = _interopRequireDefault(require("../services/redis-service"));
var _process = require("../utils/process");
var _logger = _interopRequireDefault(require("../utils/logger"));var _dec, _class;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}

// 默认随机复读频率 5%
const DEFAULT_RATE = 0.05;
// const READ_AGAIN_RANDOM_TABLE = 'read-again-random';
let








ReadAgainRandom = (_dec = (0, _plugin.Plugin)({ name: 'read-again-random', weight: 97, type: 'group', shortInfo: '随机复读', info: '当同一群聊连续出现相同消息三次时, 进行复读', mute: true }), _dec(_class = class ReadAgainRandom {
  go(body) {var _this = this;return _asyncToGenerator(function* () {const
      message = body.message,groupId = body.group_id;
      const randomRate = Math.random();
      const groupRate = yield _this.getGroupRandomRate(groupId);
      if (randomRate < groupRate) {
        _logger.default.info(`group ${groupId} random read again: '${message}'`);
        yield (0, _process.sleep)();
        _qqService.default.sendGroupMessage(groupId, message);
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

  // @withTransaction
  // async createTable(trx) {
  //   if (!(await trx.scheme.hasTable(READ_AGAIN_RANDOM_TABLE))) {
  //     await trx.scheme.createTable(READ_AGAIN_RANDOM_TABLE, (table) => {
  //       table.bigInteger('group_id').primary();
  //       table.double('random_rate');
  //     });
  //   }
  // }
}) || _class);var _default =

ReadAgainRandom;exports.default = _default;