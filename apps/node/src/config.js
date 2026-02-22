import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class Config {
  port = 3000;
  workerUrl = '';

  R2 = null;

  constructor() {
    this.loadConfig();
  }

  loadConfig() {
    const configPath = path.resolve(__dirname, '../config.json');
    try {
      const configJson = fs.readFileSync(configPath);
      const config = JSON.parse(configJson);
      this.port = config.port ?? 3000;
      this.workerUrl = config.workerUrl ?? '';
      logger.info(
        'Node config loaded: port=%s, workerUrl=%s',
        this.port,
        this.workerUrl || '(empty)'
      );
    } catch (e) {
      logger.warn(
        'config.json not found or invalid, using defaults. Copy config.example.json to config.json'
      );
    }

    const accountId = process.env.R2_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
    this.R2 = {
      ACCOUNT_ID: accountId,
      ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
      SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
      BUCKET_NAME: process.env.R2_BUCKET_NAME || 'japari-admin',
      PUBLIC_DOMAIN: process.env.R2_PUBLIC_DOMAIN || 'https://japari.zcwsr.com'
    };
  }
}

export default new Config();
