import { Command } from '../../decorators/plugin';
import QQService from '../../services/qq-service';
import OSUService from '../../services/osu-service';

@Command({
  name: 'osu绑定账号',
  command: 'recent',
  type: 'group',
  info: `绑定osu!账号和mode, 使用'!bind 你的id,mode'来调用
  mode不写默认为osu!模式
  模式代码: (0 = osu!, 1 = Taiko, 2 = CtB, 3 = osu!mania)`
})
class OSURecent {
  async run(params, body) {
    const { group_id: groupId, user_id: userId } = body;
    params = (params || '1').trim();
    const index = parseInt(params, 10);
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
      QQService.sendGroupMessage(groupId, '您未绑定osu!账号, 使用\'!bind\'进行账号绑定');
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
