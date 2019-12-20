// import { withTransaction } from '../decorators/db';
import { Plugin } from '../decorators/plugin';
import QQService from '../services/qq-service';
import RedisService from '../services/redis-service';
import ReadAgainService from '../services/read-again-service';
import logger from '../utils/logger';
import { sleep } from '../utils/process';

const DEFAULT_GROUP_INFO = { message: '', count: 1 };
@Plugin({
  name: 'read-again-follow',
  wight: 98,
  type: 'group',
  shortInfo: '跟随复读',
  info: '当同一群聊连续出现相同消息三次时, 进行复读',
  mute: true
})
class ReadAgainFollow {
  isSimilar(a, b) {
    try {
      // 判断和前一条是否相似
      return ReadAgainService.similar(a, b);
    } catch (e) {
      logger.error('get similar message error:');
      logger.error(e);
      return a === b;
    }
  }

  async go(body) {
    const { group_id: groupId, message } = body;
    const redisKey = `${this.name}-${groupId}`;
    let groupInfo = JSON.parse(await RedisService.get(redisKey)) || DEFAULT_GROUP_INFO;
    if (!this.isSimilar(groupInfo.message, message)) {
      groupInfo = { message, count: 1 };
      await RedisService.set(redisKey, JSON.stringify(groupInfo));
      return;
    }
    groupInfo.count += 1;
    if (!(groupInfo.count % 3)) {
      logger.info(`group ${groupId} random read follow: '${message}'`);
      await sleep();
      QQService.sendGroupMessage(groupId, message);
      await RedisService.set(redisKey, JSON.stringify(groupInfo));
      return 'break';
    }
    await RedisService.set(redisKey, JSON.stringify(groupInfo));
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
