import { CommandBase } from '@/decorators/types';
import HsoService from '@/services/hso-service';
import QQService from '@/services/qq-service';
import type { OB11Message } from '@/types/onebot11';
import { Command, LEVEL } from '../../decorators/plugin';
import logger from '../../utils/logger';

@Command({
  name: 'hso',
  command: 'hso',
  type: 'all',
  level: LEVEL.ADMIN,
  info: '好爽哦'
})
class NewNotice extends CommandBase {
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

  async run(params: string, body: OB11Message) {
    try {
      const p = this.getParams(params);
      const hso = await HsoService.getOne(p['+'] || p['＋'], p.newList);
      const msg = HsoService.buildMessage(hso);
      QQService.sendMessage(body, msg);
    } catch (e) {
      logger.error(e as Error);
      QQService.sendMessage(body, '色不动了');
      throw e;
    }
  }
}

export default NewNotice;
