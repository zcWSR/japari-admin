import Config from '../config';
import QQService from '../services/qq-service';
import logger from '../utils/logger';

/** Hono 中间件：捕获错误并私聊通知所有管理员，返回 500 */
export default async (c, next) => {
  try {
    await next();
  } catch (e) {
    logger.error(e);
    const admins = Config.ADMINS || [];
    admins.forEach((admin, index) => {
      setTimeout(
        () => {
          QQService.sendPrivateMessage(admin, `发生错误: \n${e.stack}`);
        },
        index ? 3 * 1000 : 0
      );
    });
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};
