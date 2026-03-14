import { GroupCommandBase } from '@/decorators/types';
import KVService from '@/services/kv-service';
import QQService from '@/services/qq-service';
import type { OB11GroupMessage } from '@/types/onebot11';
import { Command, LEVEL } from '../../decorators/plugin';

@Command({
  name: '设置随机复读概率',
  command: 'fd',
  type: 'group',
  info: "查看和设置随机复读概率, '!fd'查看当前概率, '!fd 0.x'设置概率",
  level: LEVEL.ADMIN
})
class ReadAgainRandomCommand extends GroupCommandBase {
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

  async showRate(groupId: number) {
    const rate = await this.getRate(groupId);
    QQService.sendGroupMessage(groupId, `当前随机复读概率: ${(rate * 100).toFixed(2)}%`);
  }

  async updateRate(rate: number, groupId: number) {
    await this.setRate(groupId, rate);
    QQService.sendGroupMessage(groupId, `设置当前随机复读概率为: ${(rate * 100).toFixed(2)}%`);
  }

  async run(params: string, body: OB11GroupMessage) {
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
