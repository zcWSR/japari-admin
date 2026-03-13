import QQService from '@/services/qq-service';
import { Command, LEVEL } from '../../decorators/plugin';
import homo from '../../utils/homo';
import type { CommandEvent, PluginPostTypeLike } from '../types';

@Command({
  name: '恶臭数字论证器',
  command: 'homo',
  type: 'all',
  info: 'https://lab.magiconch.com/homo/ 将任意数字分解成 114514 构成的公式',
  level: LEVEL.NORMAL
})
class Homo {
  sendMsg(body: CommandEvent, type: PluginPostTypeLike, msg: string) {
    if (type === 'group') {
      QQService.sendGroupMessage(body.group_id, msg);
    } else if (type === 'private') {
      QQService.sendPrivateMessage(body.user_id, msg);
    }
  }

  async run(params: string, body: CommandEvent, type: PluginPostTypeLike) {
    const homoNumber = Number.parseInt(params, 10);
    if (Number.isNaN(homoNumber)) {
      this.sendMsg(body, type, '数字，请');
      return;
    }
    this.sendMsg(body, type, `论 证：${homoNumber}\n\n${homo(homoNumber)}`);
  }
}

export default Homo;
