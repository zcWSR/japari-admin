import { getCloudflareContext } from '@opennextjs/cloudflare';
import logger from '../utils/logger';

/**
 * 使用 Worker 的 KV 绑定，env 来自 getCloudflareContext().env。
 */
class KVService {
  _getKV() {
    const env = getCloudflareContext().env;
    const kv = env?.KV;
    if (!kv) throw new Error('KV binding not available (not running as Worker?)');
    return kv;
  }

  async get(key) {
    try {
      const kv = this._getKV();
      return await kv.get(key);
    } catch (error) {
      logger.error(`KV get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, expirationTtl) {
    try {
      const kv = this._getKV();
      const options = expirationTtl ? { expirationTtl } : undefined;
      await kv.put(key, String(value), options);
      return true;
    } catch (error) {
      logger.error(`KV set error for key ${key}:`, error);
      return false;
    }
  }

  async delete(key) {
    try {
      const kv = this._getKV();
      await kv.delete(key);
      return true;
    } catch (error) {
      logger.error(`KV delete error for key ${key}:`, error);
      return false;
    }
  }

  async getJSON(key) {
    const value = await this.get(key);
    if (value == null) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  async setJSON(key, value, expirationTtl) {
    return this.set(key, JSON.stringify(value), expirationTtl);
  }

  /**
   * 按前缀列出 key 名称（用于如列出所有群 ID）
   * @param {string} prefix
   * @param {number} [limit=1000]
   * @returns {Promise<string[]>}
   */
  async listKeyNames(prefix, limit = 1000) {
    try {
      const kv = this._getKV();
      const out = [];
      let cursor;
      do {
        const result = await kv.list({ prefix, limit, cursor });
        out.push(...result.keys.map((k) => k.name));
        cursor = result.list_complete ? undefined : result.cursor;
      } while (cursor);
      return out;
    } catch (error) {
      logger.error(`KV list error for prefix ${prefix}:`, error);
      return [];
    }
  }
}

export default new KVService();
