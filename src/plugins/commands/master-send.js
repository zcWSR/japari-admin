import { Command, LEVEL } from '../../decorators/plugin';
import QQService from '../../services/qq-service';

@Command({
  name: 'masterSend',
  command: 'masterSend',
  type: 'private',
  level: LEVEL.SUPER_ADMIN,
  info: '操作 bot 说话'
})
class MasterSend {
  async run(params, body) {
    const match = params.match(/(group|private)(\d+)[\s|\n](.*)$/);
    if (!match) {
      QQService.sendPrivateMessage(body.user_id, '非法参数');
      return;
    }
    const [, type, id, msg] = match;
    if (!msg) return;
    if (type === 'private') {
      QQService.sendPrivateMessage(id, msg);
    } else if (type === 'group') {
      QQService.sendGroupMessage(id, msg);
    } else {
      QQService.sendPrivateMessage(body.user_id, '非法参数');
    }
  }
}

export default MasterSend;
