import { Command } from '../../decorators/plugin';
import QQService from '../../services/qq-service';
import AkhrService from '../../services/akhr-service';
import logger from '../../utils/logger';

@Command({
  name: '更新明日方舟公招干员数据',
  command: 'akhrUpdate',
  type: 'all',
  info: '更新明日方舟公招干员数据, 参数为数据源地址',
  level: 3
})
class AkhrUpdate {
  sendMsg(body, type, msg) {
    if (type === 'group') {
      QQService.sendGroupMessage(body.group_id, msg);
    } else if (type === 'private') {
      QQService.sendPrivateMessage(body.user_id, msg);
    }
  }

  async run(params, body, type) {
    try {
      await AkhrService.updateAkhrList(params);
      this.sendMsg(body, type, '公招数据已更新');
    } catch (e) {
      this.sendMsg(body, type, `公招数据更新出错, ${e.customErrorMsg || '未知错误'}`);
      logger.error('update akhr origin list error');
      throw e;
    }
  }
}

export default AkhrUpdate;
