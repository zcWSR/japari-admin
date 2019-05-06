import { Command } from '../../decorators/plugin';
import QQService from '../../services/qq-service';

@Command({
  name: '随机数',
  command: 'roll',
  type: 'all',
  info: '随机roll一个整, \'!roll xxx\'来调用(不传递参数默认上限为100)',
  default: true,
  level: 1
})
class Roll {
  sendMessage(type, body, content) {
    if (type === 'group') {
      QQService.sendGroupMessage(body.group_id, content);
    } else if (type === 'private') {
      QQService.sendPrivateMessage(body.user_id, content);
    }
  }

  roll(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  run(params, body, type) {
    const [max = 100, min = 0] = params.split(' ');
    this.sendMessage(type, body, this.roll(min, max));
  }
}

export default Roll;
