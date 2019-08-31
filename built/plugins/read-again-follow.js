"use strict";require("core-js/modules/es.promise");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;
var _plugin = require("../decorators/plugin");
var _qqService = _interopRequireDefault(require("../services/qq-service"));
var _redisService = _interopRequireDefault(require("../services/redis-service"));
var _logger = _interopRequireDefault(require("../utils/logger"));var _dec, _class;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}

const DEFAULT_GROUP_INFO = { message: '', count: 1 };let








ReadAgainFollow = (_dec = (0, _plugin.Plugin)({ name: 'read-again-follow', wight: 98, type: 'group', shortInfo: '跟随复读', info: '当同一群聊连续出现相同消息三次时, 进行复读', mute: true }), _dec(_class = class ReadAgainFollow {
  go(body) {var _this = this;return _asyncToGenerator(function* () {const
      groupId = body.group_id,message = body.message;
      const redisKey = `${_this.name}-${groupId}`;
      let groupInfo = JSON.parse((yield _redisService.default.get(redisKey))) || DEFAULT_GROUP_INFO;
      if (groupInfo.message !== message) {
        groupInfo = { message, count: 1 };
        yield _redisService.default.set(redisKey, JSON.stringify(groupInfo));
        return;
      }
      groupInfo.count += 1;
      if (!(groupInfo.count % 3)) {
        _logger.default.info(`group ${groupId} random read follow: '${message}'`);
        _qqService.default.sendGroupMessage(groupId, message);
        yield _redisService.default.set(redisKey, JSON.stringify(groupInfo));
        return 'break';
      }
      yield _redisService.default.set(redisKey, JSON.stringify(groupInfo));})();
  }

  // @withTransaction
  // async createTable(trx) {
  //   if (!(await trx.scheme.hasTable('read-again-follow'))) {
  //     await trx.scheme.createTable('read-again-follow', (table) => {
  //       table.bigInteger('group_id').primary();
  //     });
  //   }
  // }
}) || _class);var _default =

ReadAgainFollow;exports.default = _default;