import logger from '../utils/logger';

/** Hono 全局错误捕获：记录日志后继续抛出，由上层（如 botErrorReporter）处理 */
export default async (c, next) => {
  try {
    await next();
  } catch (e) {
    logger.error(e);
    throw e;
  }
};
