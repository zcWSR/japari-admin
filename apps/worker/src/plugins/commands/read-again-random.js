import { Command, LEVEL } from '../../decorators/plugin';
import KVService from '../../services/kv-service';
import QQService from '../../services/qq-service';

@Command({
  name: '设置随机复读概率',
  command: 'fd',
  type: 'group',
  info: "查看和设置随机复读概率, '!fd'查看当前概率, '!fd 0.x'设置概率",
  level: LEVEL.ADMIN
})
class ReadAgainRandomCommand {
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

  async showRate(groupId) {
    const rate = await this.getRate(groupId);
    QQService.sendGroupMessage(groupId, `当前随机复读概率: ${(rate * 100).toFixed(2)}%`);
  }

  async updateRate(rate, groupId) {
    await this.setRate(groupId, rate);
    QQService.sendGroupMessage(groupId, `设置当前随机复读概率为: ${(rate * 100).toFixed(2)}%`);
  }

  async run(params, body) {
    const { group_id: groupId, user_id: userId } = body;
    if (!params) {
      await this.showRate(groupId);
      return;
    }
    const rate = Number.parseFloat(params);
    if (await QQService.checkRateWithMessage(rate, groupId, userId)) {
      this.updateRate(rate, groupId);
    }
  }
}

export default ReadAgainRandomCommand;
