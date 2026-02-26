import Config from '@/config';
import QQService from '@/services/qq-service';
import logger from '@/utils/logger';

/**
 * 记录错误并私聊通知所有管理员（用于 japari 等路由的 catch）。
 * 不阻塞：发通知用 setTimeout 错开，调用方可直接 return 500。
 */
export function notifyAdminsOfError(e: unknown): void {
  logger.error(e);
  const admins = Config.ADMINS ?? [];
  const message = `发生错误: \n${e instanceof Error ? e.stack : String(e)}`;
  for (let i = 0; i < admins.length; i++) {
    setTimeout(
      () => {
        QQService.sendPrivateMessage(admins[i], message);
      },
      i ? 3 * 1000 : 0
    );
  }
}
