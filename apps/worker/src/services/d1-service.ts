import { getCloudflareContext } from '@opennextjs/cloudflare';

/** D1 预处理语句（最小接口） */
interface D1PreparedStatement {
  bind(...params: unknown[]): D1PreparedStatement;
  all(): Promise<{ results?: unknown[] }>;
  first(): Promise<unknown>;
  run(): Promise<unknown>;
}

/** 最小 D1 绑定接口 */
interface D1DatabaseLike {
  prepare(sql: string): D1PreparedStatement;
}

/**
 * 使用 Worker 的 D1 绑定，env 来自 getCloudflareContext().env。
 */
class D1Service {
  _getDB(): D1DatabaseLike {
    const env = getCloudflareContext().env as { DB?: D1DatabaseLike } | undefined;
    const db = env?.DB;
    if (!db) throw new Error('D1 DB binding not available (not running as Worker?)');
    return db;
  }

  /** 执行 SELECT 返回多行 */
  async all(sql: string, params: unknown[] = []): Promise<unknown[]> {
    const db = this._getDB();
    const stmt = db.prepare(sql);
    const bound = params?.length ? stmt.bind(...params) : stmt;
    const result = await bound.all();
    return (result.results ?? []) as unknown[];
  }

  /** 执行 SELECT 返回第一行 */
  async first(sql: string, params: unknown[] = []): Promise<unknown> {
    const db = this._getDB();
    const stmt = db.prepare(sql);
    const bound = params?.length ? stmt.bind(...params) : stmt;
    const row = await bound.first();
    return row ?? null;
  }

  /** 执行 INSERT/UPDATE/DELETE 等写操作 */
  async query(sql: string, params: unknown[] = []): Promise<{ results: unknown[] }> {
    const db = this._getDB();
    const stmt = db.prepare(sql);
    const bound = params?.length ? stmt.bind(...params) : stmt;
    await bound.run();
    return { results: [] };
  }
}

export default new D1Service();
