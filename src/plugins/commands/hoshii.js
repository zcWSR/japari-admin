import { Command } from '../../decorators/plugin';
import HoShiiService from '../../services/hoshii-service';
import QQService from '../../services/qq-service';
import logger from '../../utils/logger';

@Command({
  name: '5000兆円表情包生成器',
  command: 'hoshii',
  type: 'all',
  info: 'http://yurafuca.com/5000choyen/ 翻版'
})
class AkhrUpdate {
  sendMsg(body, type, msg) {
    if (type === 'group') {
      QQService.sendGroupMessage(body.group_id, msg);
    } else if (type === 'private') {
      QQService.sendPrivateMessage(body.user_id, msg);
    }
  }

  sendImg(body, type, dataUrl) {
    if (type === 'group') {
      QQService.sendGroupImage(body.group_id, dataUrl);
    } else if (type === 'private') {
      QQService.sendPrivateImage(body.user_id, dataUrl);
    }
  }

  async run(params, body, type) {
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
    const dataUrl = await HoShiiService.drawAndGetRemoteUrl(
      topText,
      bottomText,
      `${topText}-${bottomText}`
    );
    logger.info(`sending img, dataUrl: ${dataUrl}`);
    this.sendImg(body, type, dataUrl);
  }
}

export default AkhrUpdate;
