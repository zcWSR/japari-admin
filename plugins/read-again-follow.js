// import { withTransaction } from '../decorators/db';
import { Plugin } from '../decorators/plugin';
import QQService from '../services/qq-service';
import RedisService from '../services/redis-service';
import logger from '../utils/logger';

const DEFAULT_GROUP_INFO = { message: '', count: 1 };
@Plugin({
  name: 'read-again-follow',
  wight: 98,
  type: 'group',
  info: '当同一群聊连续出现相同消息三次时, 进行复读',
  mute: true
})
class ReadAgainFollow {
  async go(body) {
    const { group_id: groupId, message } = body;
    if (message === '[图片]') return;
    const redisKey = `${this.name}-${groupId}`;
    let groupInfo = JSON.parse(await RedisService.get(redisKey)) || DEFAULT_GROUP_INFO;
    if (groupInfo.message !== message) {
      groupInfo = { message, count: 1 };
      await RedisService.set(redisKey, JSON.stringify(groupInfo));
      return;
    }
    groupInfo.count += 1;
    if (groupInfo.count === 3) {
      logger.info(`group ${groupId} random read follow: '${message}'`);
      QQService.sendGroupMessage(groupId, message);
      await RedisService.set(redisKey, JSON.stringify(groupInfo));
      return 'break';
    }
  }

  // @withTransaction
  // async createTable(trx) {
  //   if (!(await trx.scheme.hasTable('read-again-follow'))) {
  //     await trx.scheme.createTable('read-again-follow', (table) => {
  //       table.bigInteger('group_id').primary();
  //     });
  //   }
  // }
}

export default ReadAgainFollow;
