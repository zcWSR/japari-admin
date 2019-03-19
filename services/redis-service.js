import Redis from 'ioredis';
import Config from '../config';
import logger from '../utils/logger';

class RedisService {
  constructor() {
    this.redis = new Redis({
      port: Config.REDIS.REDIS_PORT,
      host: '127.0.0.1',
      password: Config.REDIS.REDIS_PW,
      db: 0
    });
  }

  set(key, value) {
    logger.info(`update redis, set ${key}`);
    return this.redis.set(key, value);
  }

  get(key) {
    logger.info(`get redis, key ${key}`);
    return this.redis.get(key);
  }
}

export default new RedisService();
