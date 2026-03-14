import KVService from '@/services/kv-service';
import QQService from '@/services/qq-service';
import { PluginBase } from '@/decorators/types';
import type { OB11GroupMessage } from '@/types/onebot11';
import { Plugin } from '../decorators/plugin';
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
class GarbageWordRandom extends PluginBase {
  // ==========================================
  // KV 数据操作
  // ==========================================

  getRateKey(groupId: number) {
    return `garbage-word-random-${groupId}`;
  }

  getWordListKey(groupId: number) {
    return `garbage-word-random-word-list-${groupId}`;
  }

  async getRate(groupId: number) {
    return KVService.get(this.getRateKey(groupId));
  }

  async setRate(groupId: number, rate: number) {
    return KVService.set(this.getRateKey(groupId), String(rate));
  }

  async getWordList(groupId: number): Promise<string[]> {
    return (await KVService.getJSON(this.getWordListKey(groupId))) || [];
  }

  async setWordList(groupId: number, list: string[]) {
    return KVService.setJSON(this.getWordListKey(groupId), list);
  }

  // ==========================================
  // 业务逻辑
  // ==========================================

  async go(body: OB11GroupMessage) {
    const { group_id: groupId } = body;
    const randomRate = Math.random();
    const groupRate = await this.getGroupRandomRate(groupId);
    if (randomRate < groupRate) {
      const word = await this.getGarbageWord(groupId);
      logger.info(`group ${groupId}, send garbage: '${word}'`);
      await sleep();
      QQService.sendGroupMessage(groupId, word);
      return 'break';
    }
  }

  async getGroupRandomRate(groupId: number) {
    const randomRate = await this.getRate(groupId);
    if (!randomRate) {
      await this.setRate(groupId, DEFAULT_RATE);
      return DEFAULT_RATE;
    }
    const parsed = Number(randomRate);
    return Number.isFinite(parsed) ? parsed : DEFAULT_RATE;
  }

  async getGarbageWord(groupId: number) {
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

  // ==========================================
  // 管理端配置页（getPageConfig / setPageConfig）
  // ==========================================

  async getPageConfig(groupId: number) {
    const rate = await this.getRate(groupId);
    const wordList = await this.getWordList(groupId);
    const list = wordList.length ? wordList : DEFAULT_GARBAGE_WORD_LIST;
    return {
      title: '垃圾话随机',
      sections: [
        {
          title: '概率与词库',
          items: [
            {
              type: 'display',
              text: '触发概率 (0~1)，如 0.01 表示 1%。留空使用默认。'
            },
            {
              type: 'text',
              id: 'rate',
              label: '触发概率',
              value: rate ?? String(DEFAULT_RATE),
              placeholder: String(DEFAULT_RATE)
            },
            {
              type: 'textarea',
              id: 'wordList',
              label: '词库（每行一个或逗号分隔）',
              value: list.join('\n'),
              placeholder: '每行一个词'
            }
          ]
        }
      ]
    };
  }

  async setPageConfig(groupId: number, body: Record<string, unknown>) {
    if (body.rate != null && body.rate !== '') {
      const r = Number.parseFloat(String(body.rate));
      if (!Number.isNaN(r) && r >= 0 && r <= 1) {
        await this.setRate(groupId, r);
      }
    }
    if (body.wordList != null && String(body.wordList).trim() !== '') {
      const raw = String(body.wordList).trim();
      const list = raw
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (list.length > 0) {
        await this.setWordList(groupId, list);
      }
    }
  }
}

export default GarbageWordRandom;
