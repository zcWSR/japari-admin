import path from 'path';
import fs from 'fs';
import logger from './utils/logger';

class Config {
  DB = null;
  REDIS = null;
  OSU_APP_KEY = null;
  QQ_SERVER = null;
  NET_EAST_MUSIC_SERVER = null;
  ADMINS = null;
  BOT_QQ_ID = null;
  FIREBASE_KEY_PATH = null;
  constructor() {
    this.loadConfig();
  }

  loadConfig() {
    logger.info('loading global config');
    const configJson = fs.readFileSync(path.resolve(__dirname, '../config.json'));
    const config = JSON.parse(configJson);
    const {
      dbFilePath,
      redisPort,
      redisPw,
      osuAppKey,
      firebaseKeyPath,
      qqServer,
      netEastMusicServer,
      akhrUpdateServer,
      admins,
      botQQId,
      ocrSpaceKey
    } = config;
    this.DB = {
      filePath: dbFilePath
    };
    this.REDIS = {
      REDIS_PORT: redisPort,
      REDIS_PW: redisPw
    };
    this.OSU_APP_KEY = osuAppKey;
    this.QQ_SERVER = qqServer;
    this.NET_EAST_MUSIC_SERVER = netEastMusicServer;
    this.AKHR_UPDATE_SERVER = akhrUpdateServer;
    this.ADMINS = admins;
    this.BOT_QQ_ID = botQQId;
    this.OCR_KEY = ocrSpaceKey;

    const firebaseKeyJson = fs.readFileSync(
      path.resolve(__dirname, '../', firebaseKeyPath || './firebaseKey.json')
    );

    this.FIREBASE_KEY = JSON.parse(firebaseKeyJson);
  }
}

export default new Config();
