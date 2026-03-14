import { PluginBase } from '@/decorators/types';
import KVService from '@/services/kv-service';
import QQService from '@/services/qq-service';
import type { OB11GroupMessage } from '@/types/onebot11';
import { Plugin } from '../decorators/plugin';
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
class ReadAgainRandom extends PluginBase {
  // ==========================================
  // KV 数据操作
  // ==========================================

  getRateKey(groupId: number) {
    return `read-again-random-${groupId}`;
  }

  async getRate(groupId: number) {
    const rateString = await KVService.get(this.getRateKey(groupId));
    if (!rateString) return 0;
    return Number.parseFloat(rateString);
  }

  async setRate(groupId: number, rate: number) {
    return KVService.set(this.getRateKey(groupId), String(rate));
  }

  // ==========================================
  // 业务逻辑
  // ==========================================

  async go(body: OB11GroupMessage) {
    const { message, group_id: groupId } = body;
    const randomRate = Math.random();
    const groupRate = await this.getGroupRandomRate(groupId);
    if (randomRate < groupRate) {
      logger.info(`group ${groupId} random read again: '${formatForLog(message)}'`);
      await sleep();
      // 直接透传消息段数组
      QQService.sendGroupMessage(groupId, message);
      return 'break';
    }
  }

  async getGroupRandomRate(groupId: number) {
    let randomRate = await this.getRate(groupId);
    if (!randomRate) {
      randomRate = DEFAULT_RATE;
      this.setRate(groupId, DEFAULT_RATE);
    }
    return +randomRate;
  }
}

export default ReadAgainRandom;
