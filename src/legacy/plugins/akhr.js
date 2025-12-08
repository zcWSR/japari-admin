import { Plugin } from '../../decorators/plugin';
import QQService from '../../services/qq-service';
import RedisService from '../../services/redis-service';
import AkhrService from '../service/akhr-service';
import logger from '../../utils/logger';
import { extractFirstText } from '../../utils/message';

const COMMAND_REG = /^[!|！]akhr\s*$/;

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
  /**
   * 从消息段数组中提取第一张图片信息
   * @param {Array} message 消息段数组
   * @returns {{ file: string, url: string } | null}
   */
  getImgsFromMsg(message) {
    if (!Array.isArray(message)) {
      logger.info('message is not array, skip');
      return null;
    }
    const imgSeg = message.find((seg) => seg.type === 'image');
    if (imgSeg?.data) {
      const result = {
        file: imgSeg.data.file,
        url: imgSeg.data.url
      };
      logger.info(`got img: ${JSON.stringify(result)}`);
      return result;
    }
    logger.info('no image found in message');
    return null;
  }

  /**
   * 判断是否为 akhr 指令
   * @param {Array} message 消息段数组
   * @returns {boolean}
   */
  isCommand(message) {
    const text = extractFirstText(message);
    return COMMAND_REG.test(text);
  }

  /**
   * 判断消息中是否包含指令和图片
   * @param {Array} message 消息段数组
   * @returns {boolean}
   */
  isCommandWithImg(message) {
    if (!Array.isArray(message)) return false;
    const hasCommand = this.isCommand(message);
    const hasImage = message.some((seg) => seg.type === 'image');
    return hasCommand && hasImage;
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
  }

  async go(body) {
    const { message, group_id: groupId, user_id: userId } = body;
    try {
      // 如在该用户在等待队列中, 则直接开启分析
      if (await this.isInWaitingStack(groupId, userId)) {
        logger.info('hint waiting stack');
        const imgUrl = this.getImgsFromMsg(message);
        if (imgUrl?.url) {
          await this.combineAndSend(imgUrl.url, groupId);
          await this.clearStack(groupId);
        }
        return 'break';
      }
      // 判断是否为指令 + 图片模式
      if (this.isCommandWithImg(message)) {
        const imgUrl = this.getImgsFromMsg(message);
        if (imgUrl?.url) {
          logger.info('message "with img" mod');
          await this.combineAndSend(imgUrl.url, groupId);
        }
        return 'break';
      }
      // 判断是否为纯指令模式
      if (this.isCommand(message)) {
        logger.info('message "only command" mode');
        await this.addIntoWaitingStack(groupId, userId);
        QQService.sendGroupMessage(groupId, '等待发送图片...');
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
