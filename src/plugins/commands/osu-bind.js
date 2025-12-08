import { Command } from '../../decorators/plugin';
import OSUService from '../../services/osu-service';
import QQService from '../../services/qq-service';

@Command({
  name: 'osu绑定账号',
  command: 'bind',
  type: 'group',
  info: `绑定osu!账号和mode, 使用'!bind 你的id,mode'来调用
  mode不写默认为osu!模式
  模式代码: (0 = osu!, 1 = Taiko, 2 = CtB, 3 = osu!mania)
  例子: !bind zcWSR,3`
})
class OSUBind {
  async run(params, body) {
    const { group_id: groupId, user_id: userId } = body;
    if (!params) {
      QQService.sendGroupMessage(groupId, "非法调用, 使用'!help bind'查看调用方式");
      return;
    }
    params = params.replace('，', ','); // 处理全角逗号
    params = params.split(',');
    const osuName = params[0];
    const mode = params[1] ? Number.parseInt(params[1], 10) || 0 : 0;
    const message = await OSUService.getInstance().bindOSUId(groupId, userId, osuName, mode);
    QQService.sendGroupMessage(groupId, message);
  }
}

export default OSUBind;
