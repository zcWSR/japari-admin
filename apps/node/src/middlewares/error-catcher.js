import logger from '../utils/logger.js';

export default async (_ctx, next) => {
  try {
    await next();
  } catch (e) {
    logger.error(e);
  }
};
