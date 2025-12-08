import Config from '../config';
import QQService from '../services/qq-service';
import logger from '../utils/logger';

export default async (ctx, next) => {
  try {
    await next();
  } catch (e) {
    logger.error(e);
    Config.ADMINS.forEach((admin, index) => {
      setTimeout(
        () => {
          QQService.sendPrivateMessage(admin, `发生错误: \n${e.stack}`);
        },
        index ? 3 * 1000 : 0
      );
    });
  }
};
