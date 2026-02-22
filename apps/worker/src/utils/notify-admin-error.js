import Config from '@/config.js';
import QQService from '@/services/qq-service.js';
import logger from '@/utils/logger.js';

/**
 * 记录错误并私聊通知所有管理员（用于 japari 等路由的 catch）。
 * 不阻塞：发通知用 setTimeout 错开，调用方可直接 return 500。
 */
export function notifyAdminsOfError(e) {
  logger.error(e);
  const admins = Config.ADMINS || [];
  const message = `发生错误: \n${e?.stack ?? e}`;
  for (let i = 0; i < admins.length; i++) {
    setTimeout(
      () => {
        QQService.sendPrivateMessage(admins[i], message);
      },
      i ? 3 * 1000 : 0
    );
  }
}
