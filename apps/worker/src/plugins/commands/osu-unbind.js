import { Command } from '../../decorators/plugin';
import OSUService from '../../services/osu-service';
import QQService from '../../services/qq-service';

@Command({
  name: '解绑osu!账号',
  command: 'unbind',
  type: 'group',
  info: "解除osu!账号绑定, '!unbind'来调用"
})
class OSUUnbind {
  async run(params, body) {
    const { group_id: groupId, user_id: userId } = body;
    const message = await OSUService.getInstance().unBindOSUId(groupId, userId);
    QQService.sendGroupMessage(groupId, message);
  }
}

export default OSUUnbind;
