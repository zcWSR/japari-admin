import { Command, LEVEL } from '../../decorators/plugin';
import QQService from '../../services/qq-service';
import homo from '../../utils/homo';

@Command({
  name: '恶臭数字论证器',
  command: 'homo',
  type: 'all',
  info: 'https://lab.magiconch.com/homo/ 将任意数字分解成 114514 构成的公式',
  level: LEVEL.NORMAL
})
class Homo {
  sendMsg(body, type, msg) {
    if (type === 'group') {
      QQService.sendGroupMessage(body.group_id, msg);
    } else if (type === 'private') {
      QQService.sendPrivateMessage(body.user_id, msg);
    }
  }

  async run(params, body, type) {
    const homoNumber = Number.parseInt(params, 10);
    if (Number.isNaN(homoNumber)) {
      this.sendMsg(body, type, '数字，请');
      return;
    }
    this.sendMsg(body, type, `论 证：${homoNumber}\n\n${homo(homoNumber)}`);
  }
}

export default Homo;
