import admin from 'firebase-admin';
import Config from '../config';
import logger from '../utils/logger';

class FirebaseService {
  init() {
    this.bucketUrl = 'japari-park-e9cc5.appspot.com';
    this.app = admin.initializeApp({
      credential: admin.credential.cert(Config.FIREBASE_KEY),
      storageBucket: this.bucketUrl
    });
    this.bucket = this.app.storage().bucket();
    this.db = this.app.firestore();
  }

  getSchedulesRef() {
    if (this.schedulesRef) return this.schedulesRef;
    this.schedulesRef = this.db.collection('schedules');
    return this.schedulesRef;
  }

  async uploadImage(filePath, imageBuffer, metadata = {}) {
    const file = this.bucket.file(filePath);
    const [exist] = await file.exists();
    if (!exist) {
      logger.info(`uploading image to firebase: ${filePath}`);
      await file.save(imageBuffer, {
        validation: 'md5',
        metadata: {
          contentType: 'image/png',
          cacheControl: 'public,max-age=31536000',
          ...metadata
        }
      });
      await file.makePublic();
    } else {
      logger.info(`image already exists: ${filePath}`);
    }
    const [isPublic] = await file.isPublic();
    // 处理已存在但是不是 public 的情况
    if (exist && !isPublic) {
      logger.info(`making image public: ${filePath}`);
      await file.makePublic();
    }
    return file.publicUrl();
  }
}

export default new FirebaseService();
