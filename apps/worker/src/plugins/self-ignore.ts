import { PluginBase } from '@/decorators/types';
import type { OB11Message } from '@/types/onebot11';
import Config from '../config';
import { Plugin } from '../decorators/plugin';

@Plugin({
  name: 'self-ignore',
  weight: Number.POSITIVE_INFINITY,
  type: 'message',
  shortInfo: '防死循环',
  info: '防止出现发送消息后, 又被自己读取到造成死循环的情况',
  default: true,
  mute: true,
  hide: true
})
class SelfIgnore extends PluginBase {
  async go(body: OB11Message) {
    if (body.user_id === Config.BOT_QQ_ID) {
      return 'break';
    }
  }
}

export default SelfIgnore;
