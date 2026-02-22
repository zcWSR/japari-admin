import OSUService from '@/services/osu-service.js';
import QQService from '@/services/qq-service.js';
import { Command } from '../../decorators/plugin';

@Command({
  name: '解绑osu!账号',
  command: 'unbind',
  type: 'group',
  info: "解除osu!账号绑定, '!unbind'来调用"
})
class OSUUnbind {
  async run(_params, body) {
    const { group_id: groupId, user_id: userId } = body;
    const message = await OSUService.getInstance().unBindOSUId(groupId, userId);
    QQService.sendGroupMessage(groupId, message);
  }
}

export default OSUUnbind;
