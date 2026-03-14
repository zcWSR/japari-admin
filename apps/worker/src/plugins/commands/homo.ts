import { CommandBase } from '@/decorators/types';
import QQService from '@/services/qq-service';
import type { OB11Message } from '@/types/onebot11';
import { Command, LEVEL } from '../../decorators/plugin';
import homo from '../../utils/homo';

@Command({
  name: '恶臭数字论证器',
  command: 'homo',
  type: 'all',
  info: 'https://lab.magiconch.com/homo/ 将任意数字分解成 114514 构成的公式',
  level: LEVEL.NORMAL
})
class Homo extends CommandBase {
  async run(params: string, body: OB11Message) {
    const homoNumber = Number.parseInt(params, 10);
    if (Number.isNaN(homoNumber)) {
      QQService.sendMessage(body, '数字，请');
      return;
    }
    QQService.sendMessage(body, `论 证：${homoNumber}\n\n${homo(homoNumber)}`);
  }
}

export default Homo;
