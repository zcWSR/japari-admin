import { Command } from '../../decorators/plugin';
import OSUService from '../../services/osu-service';
import QQService from '../../services/qq-service';

@Command({
  name: '查询osu!最近游玩记录',
  command: 'recent',
  type: 'group',
  info: `查看所绑定账号的最近一次游玩记录, '!recent 最近的第几次'来调用, 第几次不传默认为最近一次
  例子: '!recent 2' 或 '!recent`
})
class OSURecent {
  async run(params, body) {
    const { group_id: groupId, user_id: userId } = body;
    params = (params || '1').trim();
    const index = Number.parseInt(params, 10);
    if (!index) {
      QQService.sendGroupMessage(groupId, `非法参数'${params}', 使用'!help recent'查看使用方法'`);
      return;
    }
    if (index > 20 || index < 1) {
      QQService.sendGroupMessage(groupId, '仅支持recent查询范围#1-#20, 请重试');
      return;
    }
    const bindUserInfo = await OSUService.getInstance().getBoundInfo(groupId, userId);
    if (!bindUserInfo) {
      QQService.sendGroupMessage(groupId, "您未绑定osu!账号, 使用'!bind'进行账号绑定");
      return;
    }
    const info = await OSUService.getInstance().getRecent(bindUserInfo, index);
    if (typeof info === 'string') {
      QQService.sendGroupMessage(groupId, info);
      return;
    }
    await OSUService.getInstance().sendInfo(`recent#${index}`, info, groupId);
  }
}

export default OSURecent;
