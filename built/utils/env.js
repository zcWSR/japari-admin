"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.isDev = isDev;let dev;
const DEV_ENV_TYPES = ['dev', 'develop', 'development', 'debug'];

function isDev() {
  if (dev !== undefined) return dev;
  const result = DEV_ENV_TYPES.find(value => value === process.env.NODE_ENV);
  dev = !!result;
  return dev;
}