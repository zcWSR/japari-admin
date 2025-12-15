import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import Config from '../config';
import logger from '../utils/logger';

class R2Service {
  init() {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${Config.R2.ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: Config.R2.ACCESS_KEY_ID,
        secretAccessKey: Config.R2.SECRET_ACCESS_KEY
      }
    });
    this.bucketName = Config.R2.BUCKET_NAME;
    this.publicDomain = Config.R2.PUBLIC_DOMAIN;
    logger.info('R2 service initialized');
  }

  async uploadImage(filePath, imageBuffer, metadata = {}) {
    try {
      // 检查文件是否存在
      let exists = false;
      try {
        await this.client.send(
          new HeadObjectCommand({
            Bucket: this.bucketName,
            Key: filePath
          })
        );
        exists = true;
        logger.info(`image already exists: ${filePath}`);
      } catch (err) {
        if (err.name !== 'NotFound') throw err;
      }

      if (!exists) {
        logger.info(`uploading image to R2: ${filePath}`);
        await this.client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: filePath,
            Body: imageBuffer,
            ContentType: metadata.contentType || 'image/png',
            CacheControl: metadata.cacheControl || 'public,max-age=31536000'
          })
        );
      }

      return `${this.publicDomain}/${filePath}`;
    } catch (error) {
      logger.error('R2 upload error:', error);
      throw error;
    }
  }

  getPublicUrl(filePath) {
    return `${this.publicDomain}/${filePath}`;
  }
}

export default new R2Service();
