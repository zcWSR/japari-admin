"use strict";require("core-js/modules/es.promise");require("core-js/modules/es.string.match");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _plugin = require("../decorators/plugin");
var _qqService = _interopRequireDefault(require("../services/qq-service"));
var _redisService = _interopRequireDefault(require("../services/redis-service"));
var _akhrService = _interopRequireDefault(require("../services/akhr-service"));
var _logger = _interopRequireDefault(require("../utils/logger"));var _dec, _class;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}

const COMMAND_REG = /^[!|！]akhr/;

const IMG_REG = /\[CQ:image,file=([^,]+),url=([^\]]+)\]/g;

const WAITING_STACK_KEY = 'akhr-waiting';let











Akhr = (_dec = (0, _plugin.Plugin)({ name: 'Akhr', weight: 99, type: 'group', shortInfo: '明日方舟公开招募计算', info: `明日方舟公开招募计算, 根据游戏截图自动生成招募信息, 使用方法有两种: 
1. 先发一条!akhr, 然后再发图片, 会自动识别指令后跟着的第一张图片
2. 发送!akhr后跟一张图片, 会自动识别图片内容`, mute: true }), _dec(_class = class Akhr {getImgsFromMsg(msg) {_logger.default.info(`getting img from message: ${msg}`);
    const search = IMG_REG.exec(msg);
    if (search) {
      const result = {
        file: search[1],
        url: search[2] };

      _logger.default.info(`got img: ${JSON.stringify(result)}`);
      return result;
    }
    _logger.default.info('get failed');
    return null;
  }

  isCommand(content) {
    return content.match(COMMAND_REG);
  }

  isInWaitingStack(groupId, userId) {return _asyncToGenerator(function* () {
      const result = yield _redisService.default.redis.hget(WAITING_STACK_KEY, groupId);
      if (result === `${userId}`) {
        _logger.default.info(`akhr: user: ${groupId}-${userId} is in waiting stack`);
        return true;
      }
      return false;})();
  }

  addIntoWaitingStack(groupId, userId) {return _asyncToGenerator(function* () {
      yield _redisService.default.redis.hset(WAITING_STACK_KEY, groupId, userId);
      _logger.default.info(`akhr: user: ${groupId}-${userId} add into waiting stack`);})();
  }

  clearStack(groupId) {return _asyncToGenerator(function* () {
      yield _redisService.default.redis.hdel(WAITING_STACK_KEY, groupId);
      _logger.default.info(`akhr: clear group ${groupId} waiting stack`);})();
  }

  combineAndSend(imgUrl, groupId) {return _asyncToGenerator(function* () {
      _logger.default.info(`start analyse ${imgUrl}`);
      const words = yield _akhrService.default.getORCResult(imgUrl);
      const hrList = yield _akhrService.default.getAkhrList();
      const result = _akhrService.default.combine(words, hrList);
      const msg = _akhrService.default.parseTextOutput(hrList, result);
      _qqService.default.sendGroupMessage(groupId, msg);})();
  }

  go(body) {var _this = this;return _asyncToGenerator(function* () {const
      message = body.message,groupId = body.group_id,userId = body.user_id;
      try {
        // 如在该用户在等待队列中, 则直接开启分析
        if (yield _this.isInWaitingStack(groupId, userId)) {
          _logger.default.info('hint waiting stack');
          const imgUrl = _this.getImgsFromMsg(message);
          if (imgUrl) {
            yield _this.combineAndSend(imgUrl.url, groupId);
            yield _this.clearStack(groupId);
            return 'break';
          }
          return;
        }
        // 如为指令, 则判断启动模式
        if (_this.isCommand(message)) {
          const imgUrl = _this.getImgsFromMsg(message);
          // 存在图片, 直接分析
          if (imgUrl) {
            _logger.default.info('message with img mod');
            yield _this.combineAndSend(imgUrl.url, groupId);
          } else {// 加入等待队列
            _logger.default.info('message only command mode');
            yield _this.addIntoWaitingStack(groupId, userId);
          }
          return 'break';
        }
      } catch (e) {
        _qqService.default.sendGroupMessage(groupId, '解析失败');
        throw e;
      }})();
  }}) || _class);var _default =


Akhr;exports.default = _default;