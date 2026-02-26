import { getCloudflareContext } from '@opennextjs/cloudflare';
import logger from '../utils/logger';

/** 最小 KV 绑定接口（与 Cloudflare KV 一致） */
interface KVNamespaceLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options: { prefix?: string; limit?: number; cursor?: string }): Promise<{
    keys: { name: string }[];
    list_complete: boolean;
    cursor?: string;
  }>;
}

/**
 * 使用 Worker 的 KV 绑定，env 来自 getCloudflareContext().env。
 */
class KVService {
  _getKV(): KVNamespaceLike {
    const env = getCloudflareContext().env as { KV?: KVNamespaceLike } | undefined;
    const kv = env?.KV;
    if (!kv) throw new Error('KV binding not available (not running as Worker?)');
    return kv;
  }

  async get(key: string): Promise<string | null> {
    try {
      const kv = this._getKV();
      return await kv.get(key);
    } catch (error) {
      logger.error(`KV get error for key ${key}: ${String(error)}`);
      return null;
    }
  }

  async set(key: string, value: string, expirationTtl?: number): Promise<boolean> {
    try {
      const kv = this._getKV();
      const options = expirationTtl ? { expirationTtl } : undefined;
      await kv.put(key, String(value), options);
      return true;
    } catch (error) {
      logger.error(`KV set error for key ${key}: ${String(error)}`);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const kv = this._getKV();
      await kv.delete(key);
      return true;
    } catch (error) {
      logger.error(`KV delete error for key ${key}: ${String(error)}`);
      return false;
    }
  }

  async getJSON<T = unknown>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (value == null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async setJSON(key: string, value: unknown, expirationTtl?: number): Promise<boolean> {
    return this.set(key, JSON.stringify(value), expirationTtl);
  }

  /**
   * 按前缀列出 key 名称（用于如列出所有群 ID）
   */
  async listKeyNames(prefix: string, limit = 1000): Promise<string[]> {
    try {
      const kv = this._getKV();
      const out: string[] = [];
      let cursor: string | undefined;
      do {
        const result = await kv.list({ prefix, limit, cursor });
        out.push(...result.keys.map((k) => k.name));
        cursor = result.list_complete ? undefined : result.cursor;
      } while (cursor);
      return out;
    } catch (error) {
      logger.error(`KV list error for prefix ${prefix}: ${String(error)}`);
      return [];
    }
  }
}

export default new KVService();
