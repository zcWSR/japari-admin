import Redis from 'ioredis';
import Config from '../config';
import logger from '../utils/logger';

const GROUP_PLUGIN_CONFIG_KEY = 'group-plugin-config';

const getGroupPluginConfigKey = (key) => `${GROUP_PLUGIN_CONFIG_KEY}-${key}`;

class RedisService {
  connect() {
    return new Promise((resolve, reject) => {
      this.redis = new Redis({
        port: Config.REDIS.REDIS_PORT,
        host: '127.0.0.1',
        password: Config.REDIS.REDIS_PW,
        db: 0,
        enableReadyCheck: true,
        retryStrategy: (times) => {
          if (times > 10) {
            logger.error('redis reconnect 10 times, shutdown');
            reject(new Error('connect redis timeout'));
            return false;
          }
          return times;
        }
      });
      this.redis.on('error', (e) => {
        logger.error('redis error:');
        if (e.code === 'ECONNREFUSED') {
          logger.error(`connect refuesed, address: ${e.address}, port: ${e.port}`);
        } else {
          logger.error(e);
        }
      });
      this.redis.on('ready', () => {
        logger.info('redis connected');
        resolve();
      });
    });
  }

  set(key, value) {
    logger.debug(`update redis, set ${key}, value ${value}`);
    return this.redis.set(key, value);
  }

  get(key) {
    logger.debug(`get redis, key ${key}`);
    return this.redis.get(key);
  }

  getGroupPluginConfig(groupId) {
    return this.redis.smembers(getGroupPluginConfigKey(groupId));
  }

  async updateGroupPluginConfig(groupId, pluginList) {
    await this.redis.del(getGroupPluginConfigKey(groupId));
    return this.redis.sadd(getGroupPluginConfigKey(groupId), ...pluginList);
  }
}

export default new RedisService();
