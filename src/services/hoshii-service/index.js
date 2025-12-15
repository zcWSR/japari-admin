import logger from '../../utils/logger';
import R2Service from '../r2-service';
import Drawer from './image-drawer';

class HoShiiService {
  drawImage(topText, bottomText) {
    const drawer = new Drawer(topText, bottomText);
    const draw = drawer.draw();
    logger.info('drawing image');
    return draw.toBuffer('image/png');
  }

  async drawAndGetRemoteUrl(topText, bottomText, fileName) {
    const filePath = `hoshii/${fileName}.png`;
    return R2Service.uploadImage(filePath, this.drawImage(topText, bottomText));
  }
}

export default new HoShiiService();
