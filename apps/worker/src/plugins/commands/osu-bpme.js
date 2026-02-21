import { Command } from '../../decorators/plugin';
import OSUService from '../../services/osu-service';
import QQService from '../../services/qq-service';

@Command({
  name: '查看osu!所绑定账号的bp',
  command: 'bpme',
  type: 'group',
  info: "查看所绑定账号的bp, '!bpme 第几bp'来调用, 第几bp不传默认为第一bp, 如: '!bpme 2' 或 '!bpme'"
})
class OSUBpMe {
  async run(params, body) {
    const { group_id: groupId, user_id: userId } = body;
    params = (params || '1').trim();
    const index = Number.parseInt(params, 10);
    if (!index) {
      QQService.sendGroupMessage(groupId, `非法参数'${params}', 使用'!help bpme'查看使用方法'`);
      return;
    }
    if (index > 20 || index < 1) {
      QQService.sendGroupMessage(groupId, '仅支持bp查询范围#1-#20, 请重试');
      return;
    }
    const bindUserInfo = await OSUService.getInstance().getBoundInfo(groupId, userId);
    if (!bindUserInfo) {
      QQService.sendGroupMessage(groupId, "非法参数, 您未绑定osu!账号, 使用'!bind'进行账号绑定");
      return;
    }
    const info = await OSUService.getInstance().getBP(bindUserInfo, index);
    if (typeof info === 'string') {
      QQService.sendGroupMessage(groupId, info);
      return;
    }
    await OSUService.getInstance().sendInfo(`bp#${index}`, info, groupId);
  }
}

export default OSUBpMe;
