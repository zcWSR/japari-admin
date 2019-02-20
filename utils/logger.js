import log4js from 'log4js';

const DEV_ENV_TYPES = ['dev', 'develop', 'development', 'debug'];

const logger = log4js.getLogger();
logger.level = DEV_ENV_TYPES.findIndex(env => env === process.env.NODE_ENV) > -1 ? 'debug' : 'info';

export default logger;
