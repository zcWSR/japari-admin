import { withTransaction } from '../decorators/db';
import { Plugin } from '../decorators/plugin';
import QQService from '../services/qq-service';
import logger from '../utils/logger';

@Plugin({
  name: 'read-again-follow',
  wight: 98,
  type: 'group',
  info: '当同一群聊连续出现相同消息三次时, 进行复读',
  mute: true
})
class ReadAgainFollow {
  async go(body) {
    logger.info('follow');
  }

  @withTransaction
  async createTable(trx) {
    if (!(await trx.scheme.hasTable('read-again-follow'))) {
      await trx.scheme.createTable('read-again-follow', (table) => {
        table.bigInteger('group_id').primary();
      });
    }
  }
}

export default ReadAgainFollow;
