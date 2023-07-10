import { Plugin } from '../decorators/plugin';
// import { withTransaction } from '../decorators/db';
import QQService from '../services/qq-service';
import RedisService from '../services/redis-service';
import { sleep } from '../utils/process';
import logger from '../utils/logger';

// 默认随机复读频率 5%
const DEFAULT_RATE = 0.05;
// const READ_AGAIN_RANDOM_TABLE = 'read-again-random';

@Plugin({
  name: 'read-again-random',
  weight: 97,
  type: 'group',
  shortInfo: '随机复读',
  info: '当同一群聊连续出现相同消息三次时, 进行复读',
  default: true,
  mute: true
})
class ReadAgainRandom {
  async go(body) {
    const { message, group_id: groupId } = body;
    const randomRate = Math.random();
    const groupRate = await this.getGroupRandomRate(groupId);
    if (randomRate < groupRate) {
      logger.info(`group ${groupId} random read again: '${message}'`);
      await sleep();
      QQService.sendGroupMessage(groupId, message);
      return 'block';
    }
    return null;
  }

  async getGroupRandomRate(groupId) {
    let randomRate = await RedisService.get(`${this.name}-${groupId}`);
    if (!randomRate) {
      randomRate = DEFAULT_RATE;
      this.setGroupRandomRate(groupId, DEFAULT_RATE);
    }
    return +randomRate;
  }

  setGroupRandomRate(groupId, rate) {
    return RedisService.set(`${this.name}-${groupId}`, rate);
  }

  // @withTransaction
  // async createTable(trx) {
  //   if (!(await trx.scheme.hasTable(READ_AGAIN_RANDOM_TABLE))) {
  //     await trx.scheme.createTable(READ_AGAIN_RANDOM_TABLE, (table) => {
  //       table.bigInteger('group_id').primary();
  //       table.double('random_rate');
  //     });
  //   }
  // }
}

export default ReadAgainRandom;
