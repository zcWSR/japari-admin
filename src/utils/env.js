let dev;
const DEV_ENV_TYPES = ['dev', 'develop', 'development', 'debug'];

export function isDev() {
  if (dev !== undefined) return dev;
  const result = DEV_ENV_TYPES.find(value => value === process.env.NODE_ENV);
  dev = !!result;
  return dev;
}
