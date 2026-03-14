import { GroupCommandBase } from '@/decorators/types';
import QQService from '@/services/qq-service';
import type { OB11GroupMessage } from '@/types/onebot11';
import { Command } from '../../decorators/plugin';

@Command({
  name: 'pr',
  command: 'pr',
  type: 'group',
  info: '舔',
  default: true
})
class Roll extends GroupCommandBase {
  noPr() {
    return Math.random() < 0.1;
  }

  run(params: string, body: OB11GroupMessage) {
    if (this.noPr()) {
      QQService.sendGroupMessage(body.group_id, '不舔了, 舔不动了');
      return;
    }
    if (params) {
      if (Math.random() > 0.5) {
        QQService.sendGroupMessage(body.group_id, `舔舔${params}`);
      } else {
        // 戳一戳消息段
        QQService.sendGroupMessage(body.group_id, [
          { type: 'poke', data: { type: '1', id: String(body.user_id) } }
        ]);
      }
    } else {
      QQService.sendGroupMessage(body.group_id, 'prpr');
    }
  }
}

export default Roll;
