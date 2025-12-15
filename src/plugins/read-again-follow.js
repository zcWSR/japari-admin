// import { withTransaction } from '../decorators/db';
import { Plugin } from '../decorators/plugin';
import QQService from '../services/qq-service';
import RedisService from '../services/redis-service';
import ReadAgainService from '../services/read-again-service';
import logger from '../utils/logger';
import { sleep } from '../utils/process';
import { formatForLog, isSegmentEqual } from '../utils/message';

const DEFAULT_GROUP_INFO = { message: null, count: 1 };

@Plugin({
  name: 'read-again-follow',
  weight: 98,
  type: 'group',
  shortInfo: '跟随复读',
  info: '当同一群聊连续出现相同消息三次时, 进行复读',
  default: true,
  mute: true
})
class ReadAgainFollow {
  /**
   * 判断两个消息段数组是否相似
   * - 非文字段（image/at/face 等）：全等比较
   * - 文字段：相似度比较
   * @param {Array|string} a 消息 A
   * @param {Array|string} b 消息 B
   * @returns {boolean} 是否相似
   */
  isSimilar(a, b) {
    try {
      // 兼容旧数据：如果存储的是字符串或 null
      if (!a || !b) return false;
      if (typeof a === 'string' || typeof b === 'string') {
        return a === b;
      }
      if (!Array.isArray(a) || !Array.isArray(b)) {
        return false;
      }
      // 段落数量不同，直接不相似
      if (a.length !== b.length) {
        return false;
      }

      return a.every((segA, index) => {
        const segB = b[index];
        // 类型不同，不相似
        if (segA.type !== segB.type) {
          return false;
        }
        // 文字段：相似度比较
        if (segA.type === 'text') {
          return ReadAgainService.similar(segA.data.text || '', segB.data.text || '');
        }
        // 非文字段（image/at/face/record 等）：全等比较 data
        return isSegmentEqual(segA, segB);
      });
    } catch (e) {
      logger.error('get similar message error:');
      logger.error(e);
      return false;
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
      logger.info(`group ${groupId} read follow: '${formatForLog(message)}'`);
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
