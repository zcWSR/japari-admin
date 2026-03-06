import { getCloudflareContext } from '@opennextjs/cloudflare';

type EnvLike = Record<string, unknown> | undefined;

function fromEnv(env: EnvLike, key: string): string | undefined;
function fromEnv(env: EnvLike, key: string, defaultValue: string): string;
function fromEnv(env: EnvLike, key: string, defaultValue?: string): string | undefined {
  const v = env?.[key];
  if (v === undefined || v === '') return defaultValue;
  return typeof v === 'string' ? v : String(v);
}

function fromEnvArray(env: EnvLike, key: string, defaultValue: number[] = []): number[] {
  const v = env?.[key];
  if (v == null) return defaultValue;
  if (Array.isArray(v)) return v.map(Number).filter((n) => !Number.isNaN(n));
  if (typeof v === 'string') {
    return v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => !Number.isNaN(n));
  }
  return defaultValue;
}

interface CachedConfigShape {
  ENVIRONMENT: string;
  OSU_APP_KEY?: string;
  QQ_SERVER: string;
  NET_EAST_MUSIC_SERVER?: string;
  AKHR_UPDATE_SERVER?: string;
  ADMINS: number[];
  BOT_QQ_ID?: number;
  NODE_SERVER: string;
  HOST_BASE_URL: string;
  MANAGE_SESSION_TTL_NORMAL: number;
  MANAGE_SESSION_TTL_ADMIN: number;
}

/** 按 env 引用缓存解析结果，同一请求内只解析一次，新请求/新部署自动用新 env 重新解析 */
const configCache = new WeakMap<object, CachedConfigShape>();

function getCachedConfig(env: EnvLike): CachedConfigShape {
  const key = env ?? {};
  const cached = configCache.get(key as object);
  if (cached) return cached;

  const ttlNormalRaw = Number(fromEnv(env, 'MANAGE_SESSION_TTL_NORMAL', '600'));
  const ttlAdminRaw = Number(fromEnv(env, 'MANAGE_SESSION_TTL_ADMIN', '3600'));
  const ttlNormal = Number.isFinite(ttlNormalRaw) && ttlNormalRaw > 0 ? ttlNormalRaw : 600;
  const ttlAdmin = Number.isFinite(ttlAdminRaw) && ttlAdminRaw > 0 ? ttlAdminRaw : 3600;

  const botIdRaw = fromEnv(env, 'BOT_QQ_ID', '');

  const cachedConfig: CachedConfigShape = {
    ENVIRONMENT: fromEnv(env, 'ENVIRONMENT', 'local'),
    OSU_APP_KEY: fromEnv(env, 'OSU_APP_KEY'),
    QQ_SERVER: fromEnv(env, 'QQ_SERVER', ''),
    NET_EAST_MUSIC_SERVER: fromEnv(env, 'NET_EAST_MUSIC_SERVER'),
    AKHR_UPDATE_SERVER: fromEnv(env, 'AKHR_UPDATE_SERVER'),
    ADMINS: fromEnvArray(env, 'ADMINS', []),
    BOT_QQ_ID: botIdRaw ? Number(botIdRaw) : undefined,
    NODE_SERVER: fromEnv(env, 'NODE_SERVER', '').replace(/\/$/, ''),
    HOST_BASE_URL: fromEnv(env, 'HOST_BASE_URL', '').replace(/\/$/, ''),
    MANAGE_SESSION_TTL_NORMAL: ttlNormal,
    MANAGE_SESSION_TTL_ADMIN: ttlAdmin
  };

  configCache.set(key as object, cachedConfig);
  return cachedConfig;
}

const NULL_BINDINGS = new Set(['CF', 'R2', 'D1', 'KV']);

/**
 * 从当前请求的 CF env 读取配置（wrangler [vars] / .dev.vars），统一用 getCloudflareContext().env。
 * 同一请求内按 env 引用缓存，只解析一次。
 */
const Config = new Proxy<CachedConfigShape>({} as CachedConfigShape, {
  get(_: any, prop: string) {
    if (NULL_BINDINGS.has(prop)) return null;
    const c = getCachedConfig(getCloudflareContext().env as EnvLike);
    return (c as unknown as Record<string, unknown>)[prop];
  }
});

export default Config;
