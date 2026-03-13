import HsoService from '@/services/hso-service';
import QQService from '@/services/qq-service';
import type { OB11Segment } from '@/types/onebot11';
import { Command, LEVEL } from '../../decorators/plugin';
import logger from '../../utils/logger';
import type { CommandEvent, PluginPostTypeLike } from '../types';

@Command({
  name: 'hso',
  command: 'hso',
  type: 'all',
  level: LEVEL.ADMIN,
  info: '好爽哦'
})
class NewNotice {
  sendMessage(msg: OB11Segment[] | string, body: CommandEvent, type: PluginPostTypeLike) {
    if (type === 'group' && body.group_id != null) {
      QQService.sendGroupMessage(body.group_id, msg);
    }
    if (type === 'private' && body.user_id != null) {
      QQService.sendPrivateMessage(body.user_id, msg);
    }
  }

  getParams(params = '') {
    return params
      .trim()
      .split(' ')
      .reduce(
        (result, key) => {
          key = key.trim();
          if (result[key as keyof typeof result] !== undefined) {
            result[key as keyof typeof result] = true;
          }
          return result;
        },
        { '+': false, '＋': false, newList: false }
      );
  }

  async run(params: string, body: CommandEvent, type: PluginPostTypeLike) {
    try {
      const p = this.getParams(params);
      const hso = await HsoService.getOne(p['+'] || p['＋'], p.newList);
      const msg = HsoService.buildMessage(hso);
      this.sendMessage(msg, body, type);
    } catch (e) {
      logger.error(e as Error);
      this.sendMessage('色不动了', body, type);
      throw e;
    }
  }
}

export default NewNotice;
