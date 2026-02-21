import { getRequestEnv } from './env-store';
import logger from './utils/logger';

/**
 * Worker 下从请求 env 读取配置（wrangler [vars] / .dev.vars）。
 * 不读 config.json，所有配置来自 env。
 */
function fromEnv(key, defaultValue = null) {
  const env = getRequestEnv();
  const v = env?.[key];
  return v !== undefined && v !== '' ? v : defaultValue;
}

function fromEnvArray(key, defaultValue = []) {
  const v = fromEnv(key);
  if (v == null) return defaultValue;
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean).map(Number);
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
