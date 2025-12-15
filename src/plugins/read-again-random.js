import { Plugin } from '../decorators/plugin';
import KVService from '../services/kv-service';
import QQService from '../services/qq-service';
import logger from '../utils/logger';
import { formatForLog } from '../utils/message';
import { sleep } from '../utils/process';

// 默认随机复读频率 5%
const DEFAULT_RATE = 0.05;

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
  // ==========================================
  // KV 数据操作
  // ==========================================

  getRateKey(groupId) {
    return `read-again-random-${groupId}`;
  }

  async getRate(groupId) {
    return KVService.get(this.getRateKey(groupId));
  }

  async setRate(groupId, rate) {
    return KVService.set(this.getRateKey(groupId), String(rate));
  }

  // ==========================================
  // 业务逻辑
  // ==========================================

  async go(body) {
    const { message, group_id: groupId } = body;
    const randomRate = Math.random();
    const groupRate = await this.getGroupRandomRate(groupId);
    if (randomRate < groupRate) {
      logger.info(`group ${groupId} random read again: '${formatForLog(message)}'`);
      await sleep();
      // 直接透传消息段数组
      QQService.sendGroupMessage(groupId, message);
      return 'block';
    }
    return null;
  }

  async getGroupRandomRate(groupId) {
    let randomRate = await this.getRate(groupId);
    if (!randomRate) {
      randomRate = DEFAULT_RATE;
      this.setRate(groupId, DEFAULT_RATE);
    }
    return +randomRate;
  }
}

export default ReadAgainRandom;
