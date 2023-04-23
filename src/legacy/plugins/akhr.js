import { Plugin } from '../decorators/plugin';
import QQService from '../services/qq-service';
import RedisService from '../services/redis-service';
import AkhrService from '../services/akhr-service';
import logger from '../utils/logger';

const COMMAND_REG = /^[!|！]akhr\s*$/;
const COMMAND_WITH_IMG_REG = /^[!|！]akhr\s*\n*\[CQ:image/;

const IMG_REG = /\[CQ:image,file=([^,]+),url=([^\]]+)\]/;

const WAITING_STACK_KEY = 'akhr-waiting';

@Plugin({
  name: 'akhr',
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
    logger.info(`getting img from message: ${msg}`);
    const search = IMG_REG.exec(msg);
    if (search) {
      const result = {
        file: search[1],
        url: search[2]
      };
      logger.info(`got img: ${JSON.stringify(result)}`);
      return result;
    }
    logger.info('get failed');
    return null;
  }

  isCommand(content) {
    return content.match(COMMAND_REG) || content.match(COMMAND_WITH_IMG_REG);
  }

  async isInWaitingStack(groupId, userId) {
    const result = await RedisService.redis.hget(WAITING_STACK_KEY, groupId);
    if (result === `${userId}`) {
      logger.info(`akhr: user: ${groupId}-${userId} is in waiting stack`);
      return true;
    }
    return false;
  }

  async addIntoWaitingStack(groupId, userId) {
    await RedisService.redis.hset(WAITING_STACK_KEY, groupId, userId);
    logger.info(`akhr: user: ${groupId}-${userId} add into waiting stack`);
  }

  async clearStack(groupId) {
    await RedisService.redis.hdel(WAITING_STACK_KEY, groupId);
    logger.info(`akhr: clear group ${groupId} waiting stack`);
  }

  async combineAndSend(imgUrl, groupId) {
    QQService.sendGroupMessage(groupId, '识别中...');
    logger.info(`start analyse ${imgUrl}`);
    const words = await AkhrService.getORCResult(imgUrl);
    if (!words || !words.length) {
      QQService.sendGroupMessage(groupId, '无结果, 请重试指令');
      return;
    }
    const hrList = await AkhrService.getAkhrList();
    const result = AkhrService.combine(words, hrList);
    const data = await AkhrService.parseImageOutPut(result, true);
    QQService.sendGroupImage(groupId, data, { isBase64: true });
    // const msg = AkhrService.parseTextOutput(result);
    // QQService.sendGroupMessage(groupId, msg);
  }

  async go(body) {
    const { message, group_id: groupId, user_id: userId } = body;
    try {
      // 如在该用户在等待队列中, 则直接开启分析
      if (await this.isInWaitingStack(groupId, userId)) {
        logger.info('hint waiting stack');
        const imgUrl = this.getImgsFromMsg(message);
        if (imgUrl) {
          await this.combineAndSend(imgUrl.url, groupId);
          await this.clearStack(groupId);
        }
        return 'break';
      }
      // 如为指令, 则判断启动模式
      if (this.isCommand(message)) {
        const imgUrl = this.getImgsFromMsg(message);
        // 存在图片, 直接分析
        if (imgUrl) {
          logger.info('message "with img" mod');
          await this.combineAndSend(imgUrl.url, groupId);
        } else {
          // 加入等待队列
          logger.info('message "only command" mode');
          await this.addIntoWaitingStack(groupId, userId);
          QQService.sendGroupMessage(groupId, '等待发送图片...');
        }
        return 'break';
      }
    } catch (e) {
      await this.clearStack(groupId);
      QQService.sendGroupMessage(groupId, '解析失败, 请重试指令');
      throw e;
    }
  }
}

export default Akhr;
