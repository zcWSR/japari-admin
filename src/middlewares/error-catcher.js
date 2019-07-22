import logger from '../utils/logger';

export default async (ctx, next) => {
  try {
    await next();
  } catch (e) {
    logger.error(e);
  }
};
