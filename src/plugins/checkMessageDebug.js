import { Plugin } from '../decorators/plugin';
import QQService from '../services/qq-service';
import RedisService from '../services/redis-service';

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
    // 其实应该用插件的开启关闭来做，但目前私聊插件是全量加载的，所以先搞个 redis 存一下
    if (QQService.isSuperAdmin(userId)) {
      const debug = await RedisService.get('messageDebug');
      if (Number.parseInt(debug, 10) === 1) {
        QQService.sendPrivateMessage(userId, JSON.stringify(body, null, 2));
      }
    }
  }
}

export default CheckMessageDebug;
