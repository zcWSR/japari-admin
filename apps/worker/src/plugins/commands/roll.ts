import { CommandBase } from '@/decorators/types';
import QQService from '@/services/qq-service';
import type { OB11Message } from '@/types/onebot11';
import { Command } from '../../decorators/plugin';

@Command({
  name: '随机数',
  command: 'roll',
  type: 'all',
  info: "随机roll一个整, '!roll xxx'来调用(不传递参数默认上限为100)",
  default: true
})
class Roll extends CommandBase {
  roll(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  run(params: string, body: OB11Message) {
    const range = params.split(' ');
    const max = +range[0] || 100;
    const min = +range[1] || 0;
    QQService.sendMessage(body, String(this.roll(min, max)));
  }
}

export default Roll;
