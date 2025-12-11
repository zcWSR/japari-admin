import knex from 'knex';
import Config from '../config';
import { isDev } from '../utils/env';

class DBService {
  init() {
    /**
     * 目前在线的表有：
     * osu_map - osu 铺面缓存 （TODO: 迁移到 firebase）
     * osu_bind - osuId 群用户关系 （TODO: 迁移到 firebase）
     * new-notice - 入群提醒模板 （TODO: 迁移到 firebase）
     */
    this.DBInstance = knex({
      client: 'better-sqlite3',
      connection: {
        filename: Config.DB.filePath
      },
      useNullAsDefault: true,
      debug: isDev()
    });
  }
}

export default new DBService();
