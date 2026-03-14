import { GroupCommandBase } from '@/decorators/types';
import OSUService from '@/services/osu-service';
import QQService from '@/services/qq-service';
import type { OB11GroupMessage } from '@/types/onebot11';
import { Command } from '../../../decorators/plugin';

@Command({
  name: '解绑osu!账号',
  command: 'unbind',
  type: 'group',
  info: "解除osu!账号绑定, '!unbind'来调用"
})
class OSUUnbind extends GroupCommandBase {
  async run(_params: string, body: OB11GroupMessage) {
    const { group_id: groupId, user_id: userId } = body;
    const message = await OSUService.getInstance().unBindOSUId(groupId, userId);
    QQService.sendGroupMessage(groupId, message);
  }
}

export default OSUUnbind;
