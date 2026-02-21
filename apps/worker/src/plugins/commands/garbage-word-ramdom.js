import { Command, LEVEL } from '../../decorators/plugin';
import KVService from '../../services/kv-service';
import QQService from '../../services/qq-service';

@Command({
  name: '设置随机垃圾话及概率',
  command: 'lj',
  type: 'group',
  info: "查看和设置随机垃圾话概率, '!lj'查看当前概率, '!lj 0.x'设置概率",
  level: LEVEL.ADMIN
})
class GarbageWordCommand {
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

  async addGarbageWord(groupId, word) {
    const list = await this.getWordList(groupId);
    const index = list.indexOf(word);
    if (index !== -1) list.splice(index, 1);
    list.push(word);
    await this.setWordList(groupId, list);
    QQService.sendGroupMessage(groupId, `已添加: ${word}`);
  }

  async removeGarbageWord(groupId, inputIndex) {
    const list = await this.getWordList(groupId);
    const index = +inputIndex - 1;
    if (index < 0 || index >= list.length) {
      QQService.sendGroupMessage(groupId, 'index 不存在');
      return;
    }
    const [removed] = list.splice(index, 1);
    await this.setWordList(groupId, list);
    QQService.sendGroupMessage(groupId, `已移除: ${removed}`);
  }

  async showGarbageWordList(groupId) {
    const list = await this.getWordList(groupId);
    const listString = list.reduce((result, curr, index) => {
      result += `\n${index + 1}. ${curr}`;
      return result;
    }, '');
    QQService.sendGroupMessage(groupId, `当前垃圾话列表:${listString}`);
  }

  async showRate(groupId) {
    const rate = await this.getRate(groupId);
    QQService.sendGroupMessage(groupId, `当前随机垃圾话概率: ${(rate * 100).toFixed(2)}%`);
  }

  async updateRate(rate, groupId) {
    await this.setRate(groupId, rate);
    QQService.sendGroupMessage(groupId, `设置当前垃圾话复读概率为: ${(rate * 100).toFixed(2)}%`);
  }

  async run(params, body) {
    const { group_id: groupId, user_id: userId } = body;
    if (!params) {
      await this.showRate(groupId);
      return;
    }
    const match = params.match(/(add\s|remove\s|list)(.*)?/s);
    if (match) {
      const [, op, word] = match;
      const operation = op.trim();
      if (operation === 'add') {
        await this.addGarbageWord(groupId, word.trim());
      } else if (operation === 'remove') {
        await this.removeGarbageWord(groupId, word.trim());
      } else if (operation === 'list') {
        await this.showGarbageWordList(groupId);
      }
      return;
    }

    const rate = Number.parseFloat(params);
    if (await QQService.checkRateWithMessage(rate, groupId, userId)) {
      this.updateRate(rate, groupId);
    }
  }
}

export default GarbageWordCommand;
