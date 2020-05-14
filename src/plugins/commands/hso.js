import { Command } from '../../decorators/plugin';
import HsoService from '../../services/hso-service';
import QQService from '../../services/qq-service';
import logger from '../../utils/logger';

@Command({
  name: 'hso',
  command: 'hso',
  type: 'all',
  level: 2,
  info: '好爽哦'
})
class NewNotice {
  sendMessage(msg, body, type) {
    if (type === 'group') {
      QQService.sendGroupMessage(body.group_id, msg);
    }
    if (type === 'private') {
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
          if (result[key] !== undefined) {
            result[key] = true;
          }
          return result;
        },
        { '+': false, '＋': false, newList: false }
      );
  }

  async run(params, body, type) {
    try {
      const p = this.getParams(params);
      const hso = await HsoService.getOne(p['+'] || p['＋'], p.newList);
      const msg = HsoService.buildMessage(hso);
      this.sendMessage(msg, body, type);
    } catch (e) {
      logger.error(e.toString());
      this.sendMessage('色不动了', body, type);
      throw e;
    }
  }
}

export default NewNotice;
