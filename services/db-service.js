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
    table.bigInteger('group_id').primary();
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
    table.bigInteger('id').primary();
    table.text('map');
  }

  // 群插件配置信息
  @createWithLog('plugin_group_config')
  createPluginGroupConfigTable(table) {
    table.bigInteger('group_id').primary();
    table.string('plugin_list');
  }

  // // 指令插件群可用指令配置
  // @createWithLog('order_plugin_group_config')
  // createOrderPluginConfigTable(table) {
  //   table.bigInteger('group_id');
  //   table.text('order_list');
  // }

  async checkTables() {
    await Promise.all([
      this.createGroupConfigTable(),
      this.createOSUBindTable(),
      this.createOSUMapTable(),
      this.createPluginGroupConfigTable()
    ]);
    logger.info('all table prepared');
  }

  async isTableExist(name) {
    const hasTable = await this.DBInstance.schema.hasTable(name);
    return hasTable;
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

  // 群插件配置操作

  /**
   * 获取群插件配置
   * @param { knex } table
   */
  @withTransaction
  async getGroupPluginConfig(table, groupId) {
    const result = await table('plugin_group_config')
      .first()
      .select({ pluginList: 'plugin_list' })
      .where('group_id', groupId);
    return (result || {}).pluginList;
  }

  /**
   * 插入或更新群插件配置
   * @param { knex } table
   */
  @withTransaction
  async updateGroupPluginConfig(table, groupId, pluginList) {
    const listString = pluginList.join(' ');
    const result = await table('plugin_group_config')
      .update('plugin_list', listString)
      .where('group_id', groupId);
    return result;
  }
}

export default new DBService();
