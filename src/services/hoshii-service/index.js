// import fs from 'fs';
// import path from 'path';
import { v4 as uuid } from 'uuid';
import Drawer from './image-drawer';
import FirebaseService from '../firebase-service';

class HoShiiService {
  drawImage(topText, bottomText) {
    const drawer = new Drawer(topText, bottomText);
    const draw = drawer.draw();
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
    const imageBuffer = this.drawImage(topText, bottomText);
    const filePath = `hoshii/${fileName}.png`;
    const file = FirebaseService.bucket.file(filePath);
    const fileDownloadToken = uuid();
    await file.save(imageBuffer, {
      validation: 'md5',
      metadata: {
        contentType: 'image/png',
        cacheControl: 'max-age=31536000',
        metadata: {
          firebaseStorageDownloadTokens: fileDownloadToken
        }
      }
    });
    // file.makePublic()
    return `https://firebasestorage.googleapis.com/v0/b/${
      FirebaseService.bucketUrl
    }/o/${encodeURIComponent(filePath)}?alt=media&token=${fileDownloadToken}`;
  }
}

export default new HoShiiService();
