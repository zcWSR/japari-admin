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
      qqServer,
      netEastMusicServer,
      admins,
      botQQId
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
    this.ADMINS = admins;
    this.BOT_QQ_ID = botQQId;
  }
}

export default new Config();
