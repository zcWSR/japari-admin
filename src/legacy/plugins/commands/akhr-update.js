import { Command, LEVEL } from '../../decorators/plugin';
import AkhrService from '../../services/akhr-service';
import QQService from '../../services/qq-service';
import logger from '../../utils/logger';

@Command({
  name: '更新明日方舟公招干员数据',
  command: 'akhrUpdate',
  type: 'private',
  info: '更新明日方舟公招干员数据, 参数为数据源地址',
  level: LEVEL.SUPER_ADMIN
})
class AkhrUpdate {
  sendMsg(body, type, msg) {
    if (type === 'group') {
      QQService.sendGroupMessage(body.group_id, msg);
    } else if (type === 'private') {
      QQService.sendPrivateMessage(body.user_id, msg);
    }
  }

  async run() {
    try {
      await AkhrService.updateAndFormate();
    } catch (e) {
      logger.error('update akhr origin list error');
      throw e;
    }
  }
}

export default AkhrUpdate;
