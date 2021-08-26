import knex from 'knex';
import { isDev } from '../utils/env';
import Config from '../config';

class DBService {
  constructor() {
    /**
     * 目前在线的表有：
     * osu_map osu 铺面缓存 （TODO: 迁移到 firebase）
     * osu_bind osuId 群用户关系 （TODO: 迁移到 firebase）
     * schedule 定时任务插件
     * new-notice 入群提醒模板 （TODO: 迁移到 firebase）
     */
    this.DBInstance = knex({
      client: 'sqlite3',
      connection: {
        filename: Config.DB.filePath
      },
      debug: isDev(),
      useNullAsDefault: true
    });
  }
}

export default new DBService();
