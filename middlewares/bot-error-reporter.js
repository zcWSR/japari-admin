import logger from '../utils/logger';
import QQService from '../services/qq-service';
import { ADMINS } from '../config';

export default async (ctx, next) => {
  try {
    await next();
  } catch (e) {
    logger.error(e);
    ADMINS.forEach((admin, index) => {
      setTimeout(() => {
        QQService.sendPrivateMessage(admin, `发生错误: \n${e.stack}`);
      }, index ? 3 * 1000 : 0);
    });
  }
};
