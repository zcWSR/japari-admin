import { Plugin } from '../decorators/plugin';
import QQService from '../services/qq-service';

// 本地变量存储调试开关状态
let messageDebugEnabled = false;

export function setMessageDebug(enabled) {
  messageDebugEnabled = enabled;
}

export function getMessageDebug() {
  return messageDebugEnabled;
}

@Plugin({
  name: 'check-message-debug',
  weight: 99,
  type: 'private',
  shortInfo: '消息调试模式',
  default: true,
  mute: true,
  hide: true
})
class CheckMessageDebug {
  async go(body) {
    const { user_id: userId } = body;
    if (QQService.isSuperAdmin(userId)) {
      if (messageDebugEnabled) {
        QQService.sendPrivateMessage(userId, JSON.stringify(body, null, 2));
      }
    }
  }
}

export default CheckMessageDebug;
