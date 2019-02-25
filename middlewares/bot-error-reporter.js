import logger from '../utils/logger';
import { sendPrivateMessage } from '../services/qq-service';
import { ADMINS } from '../config';

export default async (ctx, next) => {
  try {
    await next();
  } catch (e) {
    logger.error(e);
    ADMINS.forEach((admin, index) => {
      setTimeout(() => {
        sendPrivateMessage(admin, `发生错误: \n${e.stack}`);
      }, index ? 3 * 1000 : 0);
    });
  }
};
