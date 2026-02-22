import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * 从当前请求的 CF env 读取配置（wrangler [vars] / .dev.vars），统一用 getCloudflareContext().env。
 */
function fromEnv(key, defaultValue = null) {
  const env = getCloudflareContext().env;
  const v = env?.[key];
  return v !== undefined && v !== '' ? v : defaultValue;
}

function fromEnvArray(key, defaultValue = []) {
  const v = fromEnv(key);
  if (v == null) return defaultValue;
  if (Array.isArray(v)) return v;
  if (typeof v === 'string')
    return v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number);
  return defaultValue;
}

const Config = {
  get OSU_APP_KEY() {
    return fromEnv('OSU_APP_KEY');
  },
  get QQ_SERVER() {
    return fromEnv('QQ_SERVER');
  },
  get NET_EAST_MUSIC_SERVER() {
    return fromEnv('NET_EAST_MUSIC_SERVER');
  },
  get AKHR_UPDATE_SERVER() {
    return fromEnv('AKHR_UPDATE_SERVER');
  },
  get ADMINS() {
    return fromEnvArray('ADMINS', []);
  },
  get BOT_QQ_ID() {
    const v = fromEnv('BOT_QQ_ID');
    return v != null ? Number(v) : null;
  },
  get IP() {
    return fromEnv('IP');
  },
  get NODE_URL() {
    return fromEnv('NODE_URL');
  },
  /** 管理后台长期鉴权密钥：Bearer 或 Cookie 带此值时视为管理员；与一次性 session 共用同一 Header/Cookie 名 */
  get ADMIN_SECRET() {
    return fromEnv('ADMIN_SECRET');
  },
  /** 管理后台前端根地址，用于 !setting 下发的链接，如 https://你的worker.workers.dev */
  get ADMIN_BASE_URL() {
    return fromEnv('ADMIN_BASE_URL');
  },
  // D1/KV 由绑定提供，不再从 Config 读 ID
  get CF() {
    return null;
  },
  get R2() {
    return null;
  },
  get D1() {
    return null;
  },
  get KV() {
    return null;
  }
};

export default Config;
