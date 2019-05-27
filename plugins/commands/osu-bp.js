import { Command } from '../../decorators/plugin';
import QQService from '../../services/qq-service';
import OSUService from '../../services/osu-service';

@Command({
  name: '查询osu! bp',
  command: 'bp',
  type: 'all',
  info: `查询某特定账号的bp数据, '!bp 玩家名,第几bp,mode'来调用
  第几bp不传默认为第一bp, mode不写默认为osu!模式
  模式代码: (0 = osu!, 1 = Taiko, 2 = CtB, 3 = osu!mania)`
})
class OSUBp {
  async run(params, body) {
    const { group_id: groupId } = body;
    if (!params) {
      QQService.sendGroupMessage(groupId, "缺少查询参数, 使用'!help bp'查看调用方式");
      return;
    }
    params = params.replace('，', ',');
    params = params.split(',');
    const osuName = params[0];
    if (!osuName) {
      QQService.sendGroupMessage(groupId, '非法参数, 请输入玩家昵称');
      return;
    }
    const bpIndex = parseInt(params[1] || 1, 10);
    if (bpIndex > 20 || bpIndex < 0) {
      QQService.sendGroupMessage(groupId, '非法参数, 仅支持bp查询范围#1-#20, 请重试');
      return;
    }
    const mode = parseInt(params[2] || 0, 10);
    if (mode !== 0 && mode !== 2 && mode !== 1 && mode !== 3) {
      QQService.sendGroupMessage(groupId, '非法参数, 请不要写不存在的模式谢谢');
      return;
    }
    const userInfo = await OSUService.getInstance().getUserByName(osuName, mode);
    if (typeof userInfo === 'string') {
      QQService.sendGroupMessage(groupId, userInfo);
      return;
    }
    const bpInfo = await OSUService.getInstance().getBP(
      {
        osuName: userInfo.username,
        osuId: +userInfo.user_id,
        mode
      },
      bpIndex
    );
    if (typeof bpInfo === 'string') {
      QQService.sendGroupMessage(groupId, bpInfo);
      return;
    }
    await OSUService.getInstance().sendInfo(`bp#${bpIndex}`, bpInfo, groupId);
  }
}

export default OSUBp;
