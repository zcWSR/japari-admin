import { generateImage } from '@/services/node-api';
import QQService from '@/services/qq-service';
import { Command } from '../../decorators/plugin';
import logger from '../../utils/logger';
import type { CommandEvent, PluginPostTypeLike } from '../types';

@Command({
  name: '5000兆円表情包生成器',
  command: 'hoshii',
  type: 'all',
  info: 'http://yurafuca.com/5000choyen/ 翻版'
})
class AkhrUpdate {
  sendMsg(body: CommandEvent, type: PluginPostTypeLike, msg: string) {
    if (type === 'group') {
      QQService.sendGroupMessage(body.group_id, msg);
    } else if (type === 'private') {
      QQService.sendPrivateMessage(body.user_id, msg);
    }
  }

  sendImg(body: CommandEvent, type: PluginPostTypeLike, dataUrl: string) {
    if (type === 'group') {
      QQService.sendGroupImage(body.group_id, dataUrl);
    } else if (type === 'private') {
      QQService.sendPrivateImage(body.user_id, dataUrl);
    }
  }

  async run(params: string, body: CommandEvent, type: PluginPostTypeLike) {
    const [topText, bottomText] = params.split(/\s+/);
    if (!bottomText) {
      this.sendMsg(body, type, '非法参数');
      return;
    }
    if (topText.length + bottomText.length >= 20) {
      this.sendMsg(body, type, '太长了，塞不下了~');
      return;
    }
    logger.info(`getting img from message: ${topText} ${bottomText}`);
    try {
      const url = await generateImage('hoshii', {
        topText: topText || '',
        bottomText: bottomText || '',
        fileName: `${topText}-${bottomText}`
      });
      logger.info(`sending img, url: ${url}`);
      this.sendImg(body, type, url);
    } catch (e) {
      logger.error(e);
      this.sendMsg(body, type, '生成失败，请检查 Node 服务或 NODE_SERVER 配置');
    }
  }
}

export default AkhrUpdate;
