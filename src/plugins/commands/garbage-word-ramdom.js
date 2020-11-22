import { Command } from '../../decorators/plugin';
import QQService from '../../services/qq-service';
import RedisService from '../../services/redis-service';

@Command({
  name: '设置随机垃圾话及概率',
  command: 'lj',
  type: 'group',
  info: "查看和设置随机垃圾话概率, '!lj'查看当前概率, '!lj 0.x'设置概率",
  level: 2
})
class ReadAgainFollow {
  getRateRedisKey(groupId) {
    return `garbage-word-random-${groupId}`;
  }

  getListRedisKey(groupId) {
    return `garbage-word-random-word-list-${groupId}`;
  }

  async addGarbageWord(groupId, word) {
    await RedisService.redis.sadd(this.getListRedisKey(groupId), word);
    QQService.sendGroupMessage(groupId, `已添加: ${word}`);
  }

  async removeGarbageWord(groupId, word) {
    await RedisService.redis.srem(this.getListRedisKey(groupId), word);
    QQService.sendGroupMessage(groupId, `已移除: ${word}`);
  }

  async getGarbageWordList(groupId) {
    const list = await RedisService.redis.smembers(this.getListRedisKey(groupId));
    QQService.sendGroupMessage(groupId, `当前垃圾话列表:\n${list.join('\n')}`);
  }

  async getGarbageWordRate(groupId) {
    const rate = await RedisService.get(this.getRateRedisKey(groupId));
    QQService.sendGroupMessage(
      groupId,
      `当前随机垃圾话概率: ${(rate * 100).toFixed(2)}%`
    );
  }

  async setGarbageWordRate(rate, groupId) {
    await RedisService.set(this.getRateRedisKey(groupId), rate);
    QQService.sendGroupMessage(
      groupId,
      `设置当前垃圾话复读概率为: ${(rate * 100).toFixed(2)}%`
    );
  }

  async run(params, body) {
    params = params.trim();
    const { group_id: groupId, user_id: userId } = body;
    if (!params) {
      await this.getGarbageWordRate(groupId);
      return;
    }
    const match = params.match(/(add\s|remove\s|list)(.*)?/);
    if (match) {
      const [, op, word] = match;
      const operation = op.trim();
      if (operation === 'add') {
        await this.addGarbageWord(groupId, word.trim());
      } else if (operation === 'remove') {
        await this.removeGarbageWord(groupId, word.trim());
      } else {
        await this.getGarbageWordList(groupId);
      }
      return;
    }

    const rate = parseFloat(params);
    if (await QQService.checkRateWithMessage(rate, groupId, userId)) {
      this.setGarbageWordRate(rate, groupId);
    }
  }
}

export default ReadAgainFollow;
