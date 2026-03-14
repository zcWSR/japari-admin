import { PrivateCommandBase } from '@/decorators/types';
import QQService from '@/services/qq-service';
import type { OB11PrivateMessage } from '@/types/onebot11';
import { Command, LEVEL } from '../../decorators/plugin';

@Command({
  name: 'masterSend',
  command: 'masterSend',
  type: 'private',
  level: LEVEL.SUPER_ADMIN,
  info: '操作 bot 说话'
})
class MasterSend extends PrivateCommandBase {
  async run(params: string, body: OB11PrivateMessage) {
    const match = params.match(/(group|private)(\d+)[\s|\n](.*)$/);
    if (!match) {
      QQService.sendPrivateMessage(body.user_id, '非法参数');
      return;
    }
    const [, type, id, msg] = match;
    if (!msg) return;
    if (type === 'private') {
      QQService.sendPrivateMessage(Number(id), msg);
    } else if (type === 'group') {
      QQService.sendGroupMessage(Number(id), msg);
    }
  }
}

export default MasterSend;
