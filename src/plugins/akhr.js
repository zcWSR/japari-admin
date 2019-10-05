import { Plugin } from '../decorators/plugin';
import QQService from '../services/qq-service';
import RedisService from '../services/redis-service';
import AkhrService from '../services/akhr-service';
import logger from '../utils/logger';

const COMMAND_REG = /^[!|！]akhr/;

const IMG_REG = /\[CQ:image,file=([^,]+),url=([^\]]+)\]/g;

const WAITING_STACK_KEY = 'akhr-waiting';

@Plugin({
  name: 'Akhr',
  weight: 99,
  type: 'group',
  shortInfo: '明日方舟公开招募计算',
  info: `明日方舟公开招募计算, 根据游戏截图自动生成招募信息, 使用方法有两种: 
1. 先发一条!akhr, 然后再发图片, 会自动识别指令后跟着的第一张图片
2. 发送!akhr后跟一张图片, 会自动识别图片内容`,
  mute: true
})
class Akhr {
  getImgsFromMsg(msg) {
    const search = IMG_REG.exec(msg);
    if (search) {
      return {
        file: search[1],
        url: search[2]
      };
    }
    return null;
  }

  isCommand(content) {
    return content.match(COMMAND_REG);
  }

  async isInWaitingStack(groupId, userId) {
    const result = await RedisService.redis.hget(WAITING_STACK_KEY, groupId);
    if (result) {
      logger.log(`akhr: user: ${groupId}-${userId} is in waiting stack`);
      return true;
    }
    return false;
  }

  async addIntoWaitingStack(groupId, userId) {
    await RedisService.redis.hset(WAITING_STACK_KEY, groupId, userId);
    logger.log(`akhr: user: ${groupId}-${userId} add into waiting stack`);
  }

  async clearStack(groupId) {
    await RedisService.redis.hdel(WAITING_STACK_KEY, groupId);
    logger.log(`akhr: clear group ${groupId} waiting stack`);
  }

  async combineAndSend(imgUrl, groupId) {
    logger.log(`start analyse ${imgUrl}`);
    const words = await AkhrService.getORCResult(imgUrl);
    const hrList = await AkhrService.getAkhrList();
    const result = AkhrService.combine(words, hrList);
    const msg = AkhrService.parseTextOutput(hrList, result);
    QQService.sendGroupMessage(groupId, msg);
  }

  async go(body) {
    const { message, group_id: groupId, user_id: userId } = body;
    try {
      // 如在该用户在等待队列中, 则直接开启分析
      if (await this.isInWaitingStack(groupId, userId)) {
        const imgUrl = this.getImgsFromMsg(message);
        if (imgUrl) {
          await this.combineAndSend(imgUrl, groupId);
          await this.clearStack(groupId);
          return 'break';
        }
        return;
      }
      // 如为指令, 则判断启动模式
      if (this.isCommand(message)) {
        const imgUrl = this.getImgsFromMsg(message);
        // 存在图片, 直接分析
        if (imgUrl) {
          await this.combineAndSend(imgUrl, groupId);
        } else { // 加入等待队列
          await this.addIntoWaitingStack(groupId, userId);
        }
        return 'break';
      }
    } catch (e) {
      QQService.sendGroupMessage(groupId, '解析失败');
      throw e;
    }
  }
}

export default Akhr;