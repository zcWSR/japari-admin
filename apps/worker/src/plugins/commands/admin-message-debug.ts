import { PrivateCommandBase } from '@/decorators/types';
import QQService from '@/services/qq-service';
import { Command, LEVEL } from '../../decorators/plugin';
import logger from '../../utils/logger';
import { setMessageDebug } from '../checkMessageDebug';

@Command({
  name: 'messageDebug',
  command: 'messageDebug',
  type: 'private',
  level: LEVEL.SUPER_ADMIN,
  info: '返回 JSON 格式消息'
})
class MessageDebug extends PrivateCommandBase {
  async run(params: string) {
    const isOn = params === 'true';
    setMessageDebug(isOn);
    logger.log(`messageDebug: ${isOn}`);
    QQService.sendAdminsMessage(`消息调试: ${isOn ? '开启' : '关闭'}`);
  }
}

export default MessageDebug;
