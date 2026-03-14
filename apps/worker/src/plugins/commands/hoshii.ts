import { CommandBase } from '@/decorators/types';
import { generateImage } from '@/services/node-api';
import QQService from '@/services/qq-service';
import type { OB11Message } from '@/types/onebot11';
import { Command } from '../../decorators/plugin';
import logger from '../../utils/logger';

@Command({
  name: '5000兆円表情包生成器',
  command: 'hoshii',
  type: 'all',
  info: 'http://yurafuca.com/5000choyen/ 翻版'
})
class AkhrUpdate extends CommandBase {
  async run(params: string, body: OB11Message) {
    const [topText, bottomText] = params.split(/\s+/);
    if (!bottomText) {
      QQService.sendMessage(body, '非法参数');
      return;
    }
    if (topText.length + bottomText.length >= 20) {
      QQService.sendMessage(body, '太长了，塞不下了~');
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
      QQService.sendImage(body, url);
    } catch (e) {
      logger.error(e);
      QQService.sendMessage(body, '生成失败，请检查 Node 服务或 NODE_SERVER 配置');
    }
  }
}

export default AkhrUpdate;
