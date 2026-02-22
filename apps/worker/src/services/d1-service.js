import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * 使用 Worker 的 D1 绑定，env 来自 getCloudflareContext().env。
 */
class D1Service {
  _getDB() {
    const env = getCloudflareContext().env;
    const db = env?.DB;
    if (!db) throw new Error('D1 DB binding not available (not running as Worker?)');
    return db;
  }

  /** 执行 SELECT 返回多行 */
  async all(sql, params = []) {
    const db = this._getDB();
    const stmt = db.prepare(sql);
    const bound = params?.length ? stmt.bind(...params) : stmt;
    const result = await bound.all();
    return result.results ?? [];
  }

  /** 执行 SELECT 返回第一行 */
  async first(sql, params = []) {
    const db = this._getDB();
    const stmt = db.prepare(sql);
    const bound = params?.length ? stmt.bind(...params) : stmt;
    const row = await bound.first();
    return row ?? null;
  }

  /** 执行 INSERT/UPDATE/DELETE 等写操作 */
  async query(sql, params = []) {
    const db = this._getDB();
    const stmt = db.prepare(sql);
    const bound = params?.length ? stmt.bind(...params) : stmt;
    await bound.run();
    return { results: [] };
  }
}

export default new D1Service();
