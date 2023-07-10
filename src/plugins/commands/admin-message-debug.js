import { Command, LEVEL } from '../../decorators/plugin';
import RedisService from '../../services/redis-service';
import QQService from '../../services/qq-service';
import logger from '../../utils/logger';

@Command({
  name: 'messageDebug',
  command: 'messageDebug',
  type: 'private',
  level: LEVEL.SUPER_ADMIN,
  info: '返回 JSON 格式消息'
})
class MessageDebug {
  async run(params) {
    const isOn = params === 'true';
    RedisService.set('messageDebug', isOn ? 1 : 0);
    logger.log(`messageDebug: ${isOn}`);
    QQService.sendAdminsMessage(`消息调试: ${isOn ? '开启' : '关闭'}`);
  }
}

export default MessageDebug;
