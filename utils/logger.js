import log4js from 'log4js';
import { isDev } from './env';

const logger = log4js.getLogger();
logger.level = isDev() ? 'debug' : 'info';

export default logger;
