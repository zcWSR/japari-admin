// import fs from 'fs';
// import path from 'path';
import Drawer from './image-drawer';
import FirebaseService from '../firebase-service';
import logger from '../../utils/logger';

class HoShiiService {
  drawImage(topText, bottomText) {
    const drawer = new Drawer(topText, bottomText);
    const draw = drawer.draw();
    logger.info('drawing image');
    return draw.toBuffer('image/png');
    // const stream = draw.createPNGStream();
    // const filePath = path.resolve(__dirname, '../../../res/outPut.png');
    // const out = fs.createWriteStream(filePath, { flags: 'w' });
    // stream.pipe(out);
    // out.on('finish', () => {
    //   console.log('write file to:');
    //   console.log(filePath);
    // });
    // return draw.toBuffer('image/png').toString('base64');
  }

  async drawAndGetRemoteUrl(topText, bottomText, fileName) {
    const filePath = `hoshii/${fileName}.png`;
    return FirebaseService.uploadImage(filePath, this.drawImage(topText, bottomText));
  }
}

export default new HoShiiService();
