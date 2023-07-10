import { Command, LEVEL } from '../../decorators/plugin';
import QQService from '../../services/qq-service';
import RedisService from '../../services/redis-service';

@Command({
  name: '设置随机复读概率',
  command: 'fd',
  type: 'group',
  info: "查看和设置随机复读概率, '!fd'查看当前概率, '!fd 0.x'设置概率",
  level: LEVEL.ADMIN
})
class ReadAgainFollow {
  getRedisKey(groupId) {
    return `read-again-random-${groupId}`;
  }

  async getReadAgainRate(groupId) {
    const rate = await RedisService.get(this.getRedisKey(groupId));
    QQService.sendGroupMessage(groupId, `当前随机复读概率: ${(rate * 100).toFixed(2)}%`);
  }

  async setReadAgainRate(rate, groupId) {
    await RedisService.set(this.getRedisKey(groupId), rate);
    QQService.sendGroupMessage(
      groupId,
      `设置当前随机复读概率为: ${(rate * 100).toFixed(2)}%`
    );
  }

  async run(params, body) {
    const { group_id: groupId, user_id: userId } = body;
    if (!params) {
      await this.getReadAgainRate(groupId);
      return;
    }
    const rate = parseFloat(params);
    if (await QQService.checkRateWithMessage(rate, groupId, userId)) {
      this.setReadAgainRate(rate, groupId);
    }
  }
}

export default ReadAgainFollow;
