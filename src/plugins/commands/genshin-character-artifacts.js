import { Command } from '../../decorators/plugin';
import GenshinService from '../../services/genshin-service';
import QQService from '../../services/qq-service';

@Command({
  name: '查询原神角色面板与圣遗物',
  command: ['原神查询', '圣遗物', '原神面板'],
  type: 'all',
  info: "查询原神角色面板与圣遗物, '!原神查询|原神面板|圣遗物 uid,[1-8]' 来查询, 「1-8」代表只获取展示板的几号位的, 不传默认获取全部"
})
class GenshinCharaArtifacts {
  sendMsg(body, type, msg) {
    if (type === 'group') {
      QQService.sendGroupMessage(body.group_id, msg);
    } else if (type === 'private') {
      QQService.sendPrivateMessage(body.user_id, msg);
    }
  }

  sendImg(body, type, dataUrl) {
    if (type === 'group') {
      QQService.sendGroupImage(body.group_id, dataUrl);
    } else if (type === 'private') {
      QQService.sendPrivateImage(body.user_id, dataUrl);
    }
  }

  async run(params, body, type) {
    const [uid, indexString] = params.trim().replace('，', ',').split(',');
    if (!uid) {
      this.sendMsg(body, type, '非法参数，请至少传入 uid');
      return;
    }
    const position = parseInt(indexString, 10) || 0;
    if (position >= 8) {
      this.sendMsg(body, type, '非法参数，范围限定 1-8 号位');
      return;
    }
    const url = await GenshinService.drawCharaArtifactsAndGetRemoteUrl(uid, position);
    if (!url) {
      this.sendMsg(body, type, '获取了 0 角色数据，请尝试更新展示板');
      return;
    }
    this.sendImg(body, type, url);
  }
}

export default GenshinCharaArtifacts;
