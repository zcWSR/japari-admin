import axios from 'axios';
import RedisService from './redis-service';
import logger from '../utils/logger';

const HSO_SET_KEY = 'hso-cache';
const HSO_PLUS_SET_KEY = 'hso-plus-cache';

class HsoService {
  async fetchHsoList(plusMode) {
    try {
      const page = Math.ceil(Math.random() * 100);
      logger.info(`fetching hso ${plusMode ? 'plus ' : ''}list at page ${page}...`);
      const meta = await axios({
        url: `http://konachan.${plusMode ? 'com' : 'net'}/post.json`,
        params: {
          limit: 60,
          page
        },
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36'
        }
      });
      if (meta.data.length) {
        return meta.data;
      }
      throw new Error('请求失败');
    } catch (e) {
      logger.error('fetch hso error');
      throw e;
    }
  }

  clearSet(plusMode) {
    return RedisService.redis.del(plusMode ? HSO_PLUS_SET_KEY : HSO_SET_KEY);
  }

  async addHsoListToRedis(hsoList, plusMode) {
    const formatList = hsoList.map(hso => JSON.stringify({
      id: hso.id,
      source: hso.source,
      preview: hso.preview_url,
      sample: hso.sample_url,
      plus: plusMode
    }));
    await RedisService.redis.sadd(plusMode ? HSO_PLUS_SET_KEY : HSO_SET_KEY, ...formatList);
  }

  async getOne(plusMode, newList) {
    let hsoString;
    if (!newList) {
      hsoString = await RedisService.redis.spop(plusMode ? HSO_PLUS_SET_KEY : HSO_SET_KEY);
    }
    if (!hsoString) {
      if (newList) {
        logger.info(`hso ${plusMode ? 'plus ' : ''}list refresh`);
      } else {
        logger.info(`hso ${plusMode ? 'plus ' : ''}list empty, do refetch`);
      }
      const hsoList = await this.fetchHsoList(plusMode);
      if (newList) {
        await this.clearSet(plusMode);
      }
      await this.addHsoListToRedis(hsoList, plusMode);
      return this.getOne(plusMode);
    }
    const hso = JSON.parse(hsoString);
    logger.info(`random pop one hso${plusMode ? ' plus' : ''}, id: ${hso.id}`);
    return hso;
  }

  buildMessage(hso) {
    return [
      {
        type: 'image',
        cache: 0,
        data: {
          file: hso.plus ? hso.preview : hso.sample
        }
      },
      {
        type: 'text',
        data: {
          text: hso.source ? `\n${hso.source}` : ''
        }
      }
    ];
  }
}

export default new HsoService();
