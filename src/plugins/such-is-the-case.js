import { Plugin } from '../decorators/plugin';
import QQService from '../services/qq-service';
import RedisService from '../services/redis-service';
import { sleep } from '../utils/process';
import logger from '../utils/logger';

// 默认随机复读频率 10%
const DEFAULT_RATE = 0.1;
const ARRAY_MESSAGE_FOLLOW_RATE = 0.5;

@Plugin({
  name: 'such-is-the-case',
  wight: 96,
  type: 'group',
  shortInfo: '确实',
  info: '随机回复：确实',
  mute: true
})
class SuchIsTheCase {
  async go(body) {
    const { message, group_id: groupId } = body;
    const randomRate = Math.random();
    const groupRate = await this.getGroupRandomRate(groupId);
    if (
      (Array.isArray(message) && randomRate < ARRAY_MESSAGE_FOLLOW_RATE) ||
      randomRate < groupRate
    ) {
      logger.info(`group ${groupId} message '${message}', follow 'such-is-the-case'`);
      await sleep();
      QQService.sendGroupMessage(groupId, '确实');
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
}

export default SuchIsTheCase;
