import { Plugin } from '../decorators/plugin';
import QQService from '../services/qq-service';
import RedisService from '../services/redis-service';
import { sleep } from '../utils/process';
import logger from '../utils/logger';


const GARBAGE_WORD_LIST = ['确实', '你在教我做事?', '他急了他急了', '就这?', '不会吧? 不会吧?'];
// 默认频率 1.14514%
const DEFAULT_RATE = 0.0114514 * Math.ceil(GARBAGE_WORD_LIST.length / 2);

@Plugin({
  name: 'garbage-word-random',
  weight: 96,
  type: 'group',
  shortInfo: '垃圾话',
  info: '随机回复垃圾话',
  mute: true
})
class GarbageWordRandom {
  async go(body) {
    const { group_id: groupId } = body;
    const randomRate = Math.random();
    const groupRate = await this.getGroupRandomRate(groupId);
    if (randomRate < groupRate) {
      const word = this.getGarbageWord();
      logger.info(`group ${groupId}, send garbage: '${word}'`);
      await sleep();
      QQService.sendGroupMessage(groupId, word);
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

  getGarbageWord() {
    return GARBAGE_WORD_LIST[Math.floor(Math.random() * GARBAGE_WORD_LIST.length)];
  }
}

export default GarbageWordRandom;
