/**
 * 当前请求的 Worker env（含 DB、KV 及 wrangler vars）。
 * 由中间件在每次请求时设置，供 D1Service、KVService、Config 等使用。
 */
let requestEnv = null;

export function setRequestEnv(env) {
  requestEnv = env;
}

export function getRequestEnv() {
  return requestEnv;
}
