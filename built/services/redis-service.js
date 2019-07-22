"use strict";require("core-js/modules/es.promise");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _ioredis = _interopRequireDefault(require("ioredis"));
var _config = _interopRequireDefault(require("../config"));
var _logger = _interopRequireDefault(require("../utils/logger"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

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
    _logger.default.debug(`update redis, set ${key}`);
    return this.redis.set(key, value);
  }

  get(key) {
    _logger.default.debug(`get redis, key ${key}`);
    return this.redis.get(key);
  }}var _default =


new RedisService();exports.default = _default;
//# sourceMappingURL=redis-service.js.map
