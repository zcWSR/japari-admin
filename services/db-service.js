import knex from 'knex';
import { isDev } from '../utils/env';
import { DB } from '../config';
import logger from '../utils/logger';
import { createWithLog, withTransaction } from '../decorators/db';

class DBService {
  constructor() {
    this.DBInstance = knex({
      client: 'mysql',
      connection: {
        host: DB.DB_HOST,
        user: DB.DB_USER,
        password: DB.DB_PW,
        database: DB.DB_SCHAME
      },
      debug: isDev()
    });
  }

  // qq群配置信息
  @createWithLog('group_config')
  createGroupConfigTable(table) {
    table.bigInteger('group_id');
    table.string('config');
  }

  // osu 用户数据绑定
  @createWithLog('osu_bind')
  createOSUBindTable(table) {
    table.increments('id').primary();
    table.bigInteger('user_id');
    table.bigInteger('group_id');
    table.bigInteger('osu_id');
    table.string('osu_name');
    table.integer('mode');
  }

  // osu 地图信息
  @createWithLog('osu_map')
  createOSUMapTable(table) {
    table.bigInteger('id');
    table.text('map');
  }

  // 群插件配置信息
  @createWithLog('plugin_group_config')
  createPluginGroupConfig(table) {
    table.bigInteger('group_id');
    table.string('plugin_list');
  }

  // 指令插件群可用指令配置
  @createWithLog('order_plugin_group_config')
  createOrderPluginConfigTable(table) {
    table.bigInteger('group_id');
    table.text('order_list');
  }

  /**
   * @param { knex } table
   */
  @withTransaction
  async updateGroupConfig(table, groupId, config) {
    await table('group_config')
      .update('config', JSON.stringify(config))
      .where('group_id', groupId);
  }

  async checkTables() {
    await Promise.all([
      this.createGroupConfigTable(),
      this.createOSUBindTable(),
      this.createOSUMapTable()
    ]);
    logger.info('all table prepared');
  }
}

export default new DBService();
