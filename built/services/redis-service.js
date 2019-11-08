"use strict";require("core-js/modules/es.array.iterator");require("core-js/modules/es.promise");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _ioredis = _interopRequireDefault(require("ioredis"));
var _config = _interopRequireDefault(require("../config"));
var _logger = _interopRequireDefault(require("../utils/logger"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}

const GROUP_PLUGIN_CONFIG_KEY = 'group-plugin-config';

const getGroupPluginConfigKey = key => `${GROUP_PLUGIN_CONFIG_KEY}-${key}`;

class RedisService {
  connect() {
    return new Promise((resolve, reject) => {
      this.redis = new _ioredis.default({
        port: _config.default.REDIS.REDIS_PORT,
        host: '127.0.0.1',
        password: _config.default.REDIS.REDIS_PW,
        db: 0,
        enableReadyCheck: true,
        retryStrategy: times => {
          if (times > 10) {
            _logger.default.error('redis reconnect 10 times, shutdown');
            reject(new Error('connect redis timeout'));
            return false;
          }
          return times;
        } });

      this.redis.on('error', e => {
        _logger.default.error('redis error:');
        if (e.code === 'ECONNREFUSED') {
          _logger.default.error(`connect refuesed, address: ${e.address}, port: ${e.port}`);
        } else {
          _logger.default.error(e);
        }
      });
      this.redis.on('ready', () => {
        _logger.default.info('redis connected');
        resolve();
      });
    });
  }

  set(key, value) {
    _logger.default.debug(`update redis, set ${key}, value ${value}`);
    return this.redis.set(key, value);
  }

  get(key) {
    _logger.default.debug(`get redis, key ${key}`);
    return this.redis.get(key);
  }

  getGroupPluginConfig(groupId) {
    return this.redis.smembers(getGroupPluginConfigKey(groupId));
  }

  updateGroupPluginConfig(groupId, pluginList) {var _this = this;return _asyncToGenerator(function* () {
      yield _this.redis.del(getGroupPluginConfigKey(groupId));
      return _this.redis.sadd(getGroupPluginConfigKey(groupId), ...pluginList);})();
  }}var _default =


new RedisService();exports.default = _default;