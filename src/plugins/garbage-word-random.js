import { Plugin } from '../decorators/plugin';
import KVService from '../services/kv-service';
import QQService from '../services/qq-service';
import logger from '../utils/logger';
import { sleep } from '../utils/process';

const DEFAULT_GARBAGE_WORD_LIST = [
  '确实',
  '你在教我做事?',
  '他急了他急了',
  '就这?',
  '呐',
  '呐呐呐',
  '不会吧?',
  '不会吧不会吧?'
];
// 默认频率 1.14514%
const DEFAULT_RATE = 0.0114514 * Math.ceil(DEFAULT_GARBAGE_WORD_LIST.length / 3);

@Plugin({
  name: 'garbage-word-random',
  weight: 96,
  type: 'group',
  shortInfo: '垃圾话',
  info: '随机回复垃圾话',
  default: true,
  mute: true
})
class GarbageWordRandom {
  // ==========================================
  // KV 数据操作
  // ==========================================

  getRateKey(groupId) {
    return `garbage-word-random-${groupId}`;
  }

  getWordListKey(groupId) {
    return `garbage-word-random-word-list-${groupId}`;
  }

  async getRate(groupId) {
    return KVService.get(this.getRateKey(groupId));
  }

  async setRate(groupId, rate) {
    return KVService.set(this.getRateKey(groupId), String(rate));
  }

  async getWordList(groupId) {
    return (await KVService.getJSON(this.getWordListKey(groupId))) || [];
  }

  async setWordList(groupId, list) {
    return KVService.setJSON(this.getWordListKey(groupId), list);
  }

  // ==========================================
  // 业务逻辑
  // ==========================================

  async go(body) {
    const { group_id: groupId } = body;
    const randomRate = Math.random();
    const groupRate = await this.getGroupRandomRate(groupId);
    if (randomRate < groupRate) {
      const word = await this.getGarbageWord(groupId);
      logger.info(`group ${groupId}, send garbage: '${word}'`);
      await sleep();
      QQService.sendGroupMessage(groupId, word);
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

  async getGarbageWord(groupId) {
    const list = await this.getWordList(groupId);
    if (list.length === 0) {
      await this.setWordList(groupId, DEFAULT_GARBAGE_WORD_LIST);
      return DEFAULT_GARBAGE_WORD_LIST[
        Math.floor(Math.random() * DEFAULT_GARBAGE_WORD_LIST.length)
      ];
    }
    const wordIndex = Math.floor(Math.random() * list.length);
    return list[wordIndex];
  }
}

export default GarbageWordRandom;
