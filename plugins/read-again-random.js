import { Plugin } from '../decorators/plugin';
import QQService from '../services/qq-service';
import logger from '../utils/logger';

const defaultRate = 0.01;

@Plugin({
  name: 'read-again-random',
  wight: 98,
  type: 'group',
  info: '当同一群聊连续出现相同消息三次时, 进行复读',
  mute: true
})
class ReadAgainRandom {
  async go(body) {
    
  }
}

export default ReadAgainRandom;
