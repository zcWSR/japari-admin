import QQService from '@/services/qq-service';
import { Command } from '../../decorators/plugin';
import type { CommandEvent, CommandMap, PluginEvent, PluginPostTypeLike } from '../types';

@Command({
  name: '随机数',
  command: 'roll',
  type: 'all',
  info: "随机roll一个整, '!roll xxx'来调用(不传递参数默认上限为100)",
  default: true
})
class Roll {
  sendMessage(type, body, content) {
    if (type === 'group') {
      QQService.sendGroupMessage(body.group_id, `roll: ${content}`);
    } else if (type === 'private') {
      QQService.sendPrivateMessage(body.user_id, `roll: ${content}`);
    }
  }

  roll(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  run(params: string, body: CommandEvent, type: PluginPostTypeLike) {
    const range = params.split(' ');
    const max = +range[0] || 100;
    const min = range[1] || 0;
    this.sendMessage(type, body, this.roll(min, max));
  }
}

export default Roll;
