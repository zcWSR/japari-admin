import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * 从当前请求的 CF env 读取配置（wrangler vars / .dev.vars），统一用 getCloudflareContext().env。
 * 本地：wrangler.dev.jsonc 的 vars.ENVIRONMENT + .dev.vars；线上：wrangler.jsonc 的 vars.ENVIRONMENT + Cloudflare Secrets。
 */
function fromEnv(key: string, defaultValue: string | null = null): string | null {
  const env = getCloudflareContext().env as Record<string, unknown> | undefined;
  const v = env?.[key];
  if (v === undefined || v === '') return defaultValue;
  return typeof v === 'string' ? v : String(v);
}

function fromEnvArray(key: string, defaultValue: number[] = []): number[] {
  const env = getCloudflareContext().env as Record<string, unknown> | undefined;
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

const Config = {
  /** 当前环境：local（本地 dev/preview）或 production（线上）；由 wrangler 的 vars 注入 */
  get ENVIRONMENT(): string {
    return fromEnv('ENVIRONMENT', 'local') ?? 'local';
  },
  get OSU_APP_KEY(): string | null {
    return fromEnv('OSU_APP_KEY');
  },
  get QQ_SERVER(): string | null {
    return fromEnv('QQ_SERVER');
  },
  get NET_EAST_MUSIC_SERVER(): string | null {
    return fromEnv('NET_EAST_MUSIC_SERVER');
  },
  get AKHR_UPDATE_SERVER(): string | null {
    return fromEnv('AKHR_UPDATE_SERVER');
  },
  get ADMINS(): number[] {
    return fromEnvArray('ADMINS', []);
  },
  get BOT_QQ_ID(): number | null {
    const v = fromEnv('BOT_QQ_ID');
    return v != null && v !== '' ? Number(v) : null;
  },
  get IP(): string | null {
    return fromEnv('IP');
  },
  get NODE_URL(): string | null {
    return fromEnv('NODE_URL');
  },
  /** 管理后台长期鉴权密钥：Bearer 或 Cookie 带此值时视为管理员；与一次性 session 共用同一 Header/Cookie 名 */
  get ADMIN_SECRET(): string | null {
    return fromEnv('ADMIN_SECRET');
  },
  /** 管理后台前端根地址，用于 !setting 下发的链接，如 https://你的worker.workers.dev */
  get ADMIN_BASE_URL(): string | null {
    return fromEnv('ADMIN_BASE_URL');
  },
  /** 普通管理会话 TTL，默认 10 分钟 */
  get MANAGE_SESSION_TTL_NORMAL(): number {
    const v = Number(fromEnv('MANAGE_SESSION_TTL_NORMAL', '600'));
    return Number.isFinite(v) && v > 0 ? v : 600;
  },
  /** 超管管理会话 TTL，默认 1 小时 */
  get MANAGE_SESSION_TTL_ADMIN(): number {
    const v = Number(fromEnv('MANAGE_SESSION_TTL_ADMIN', '3600'));
    return Number.isFinite(v) && v > 0 ? v : 3600;
  },
  get CF(): null {
    return null;
  },
  get R2(): null {
    return null;
  },
  get D1(): null {
    return null;
  },
  get KV(): null {
    return null;
  }
};

export default Config;
