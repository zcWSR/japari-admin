import { CommandBase } from '@/decorators/types';
import { generateImage } from '@/services/node-api';
import QQService from '@/services/qq-service';
import type { OB11Message } from '@/types/onebot11';
import { Command } from '../../decorators/plugin';

@Command({
  name: '查询原神角色面板与圣遗物',
  command: ['原神查询', '圣遗物', '原神面板'],
  type: 'all',
  info: "查询原神角色面板与圣遗物, '!原神查询|原神面板|圣遗物 uid,[1-8]' 来查询, 「1-8」代表只获取展示板的几号位的, 不传默认获取全部"
})
class GenshinCharaArtifacts extends CommandBase {
  async run(params: string, body: OB11Message) {
    const [uid, indexString] = params.replace('，', ',').split(',');
    if (!uid) {
      QQService.sendMessage(body, '非法参数，请至少传入 uid');
      return;
    }
    const position = Number.parseInt(indexString, 10) || 0;
    if (position < 0 || position > 8) {
      QQService.sendMessage(body, '非法参数，范围限定 1-8 号位');
      return;
    }
    try {
      const url = await generateImage('genshin', {
        uid,
        position: position || undefined
      });
      QQService.sendImage(body, url);
    } catch (error) {
      const err = error as Error;
      const msg = err.message || '出现了不可预料的错误';
      QQService.sendMessage(body, msg);
      if (
        !msg.includes('UID') &&
        !msg.includes('不存在') &&
        !msg.includes('维护') &&
        !msg.includes('频率')
      ) {
        throw error;
      }
    }
  }
}

export default GenshinCharaArtifacts;
