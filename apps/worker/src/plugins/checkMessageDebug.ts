import { PrivatePluginBase } from '@/decorators/types';
import QQService from '@/services/qq-service';
import type { OB11PrivateMessage } from '@/types/onebot11';
import { Plugin } from '../decorators/plugin';

// 本地变量存储调试开关状态
let messageDebugEnabled = false;

export function setMessageDebug(enabled: boolean) {
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
class CheckMessageDebug extends PrivatePluginBase {
  go(body: OB11PrivateMessage) {
    if (QQService.isSuperAdmin(body.user_id) && messageDebugEnabled) {
      QQService.sendPrivateMessage(body.user_id, JSON.stringify(body, null, 2));
    }
  }
}

export default CheckMessageDebug;
