import axios from 'axios';
import logger from '../utils/logger';
import KVService from './kv-service';

const HSO_CACHE_KEY = 'hso-cache';
const HSO_PLUS_CACHE_KEY = 'hso-plus-cache';

class HsoService {
  // ==========================================
  // KV 数据操作
  // ==========================================

  getCacheKey(plusMode) {
    return plusMode ? HSO_PLUS_CACHE_KEY : HSO_CACHE_KEY;
  }

  async getCache(plusMode) {
    return (await KVService.getJSON(this.getCacheKey(plusMode))) || [];
  }

  async setCache(plusMode, list) {
    return KVService.setJSON(this.getCacheKey(plusMode), list);
  }

  async popFromCache(plusMode) {
    const list = await this.getCache(plusMode);
    if (!list.length) return null;
    const item = list.pop();
    await this.setCache(plusMode, list);
    return item;
  }

  async addToCache(plusMode, items) {
    const existing = await this.getCache(plusMode);
    existing.push(...items);
    return this.setCache(plusMode, existing);
  }

  async clearCache(plusMode) {
    return KVService.delete(this.getCacheKey(plusMode));
  }

  // ==========================================
  // 业务逻辑
  // ==========================================

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

  async getOne(plusMode, newList) {
    let hso;
    if (!newList) {
      hso = await this.popFromCache(plusMode);
    }
    if (!hso) {
      if (newList) {
        logger.info(`hso ${plusMode ? 'plus ' : ''}list refresh`);
      } else {
        logger.info(`hso ${plusMode ? 'plus ' : ''}list empty, do refetch`);
      }
      const hsoList = await this.fetchHsoList(plusMode);
      if (newList) {
        await this.clearCache(plusMode);
      }
      const formatList = hsoList.map((item) => ({
        id: item.id,
        source: item.source,
        preview: item.preview_url,
        sample: item.sample_url,
        plus: plusMode
      }));
      await this.addToCache(plusMode, formatList);
      return this.getOne(plusMode);
    }
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
