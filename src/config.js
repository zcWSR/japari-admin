import fs from 'fs';
import path from 'path';
import logger from './utils/logger';

class Config {
  OSU_APP_KEY = null;
  QQ_SERVER = null;
  NET_EAST_MUSIC_SERVER = null;
  AKHR_UPDATE_SERVER = null;
  ADMINS = null;
  BOT_QQ_ID = null;
  IP = null;

  // Cloudflare 配置
  CF = null;
  R2 = null;
  D1 = null;
  KV = null;

  constructor() {
    this.loadConfig();
  }

  loadConfig() {
    logger.info('loading global config');
    const configJson = fs.readFileSync(path.resolve(__dirname, '../config.json'));
    const config = JSON.parse(configJson);
    const {
      osuAppKey,
      qqServer,
      netEastMusicServer,
      akhrUpdateServer,
      admins,
      botQQId,
      ip,
      // Cloudflare
      cfAccountId,
      cfApiToken,
      r2AccessKeyId,
      r2SecretAccessKey,
      r2BucketName,
      r2PublicDomain,
      d1DatabaseId,
      kvNamespaceId
    } = config;

    this.OSU_APP_KEY = osuAppKey;
    this.QQ_SERVER = qqServer;
    this.NET_EAST_MUSIC_SERVER = netEastMusicServer;
    this.AKHR_UPDATE_SERVER = akhrUpdateServer;
    this.ADMINS = admins;
    this.BOT_QQ_ID = botQQId;
    this.IP = ip;

    // Cloudflare 通用配置
    this.CF = {
      ACCOUNT_ID: cfAccountId,
      API_TOKEN: cfApiToken
    };

    // R2 配置
    this.R2 = {
      ACCOUNT_ID: cfAccountId,
      ACCESS_KEY_ID: r2AccessKeyId,
      SECRET_ACCESS_KEY: r2SecretAccessKey,
      BUCKET_NAME: r2BucketName || 'japari-admin',
      PUBLIC_DOMAIN: r2PublicDomain || 'https://japari.zcwsr.com'
    };

    // D1 配置
    this.D1 = {
      DATABASE_ID: d1DatabaseId
    };

    // Workers KV 配置
    this.KV = {
      NAMESPACE_ID: kvNamespaceId
    };
  }
}

export default new Config();
