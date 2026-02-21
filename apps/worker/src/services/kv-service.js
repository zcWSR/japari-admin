import { getRequestEnv } from '../env-store';
import logger from '../utils/logger';

/**
 * 使用 Worker 的 KV 绑定，不再走 HTTP API。
 * 依赖请求上下文的 env.KV（由 env-store 中间件注入）。
 */
class KVService {
  _getKV() {
    const env = getRequestEnv();
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
}

export default new KVService();
