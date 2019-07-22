import knex from 'knex';
import { isDev } from '../utils/env';
import Config from '../config';
import logger from '../utils/logger';
import { createWithLog, withTransaction } from '../decorators/db';

class DBService {
  constructor() {
    this.DBInstance = knex({
      // client: 'mysql',
      // connection: {
      //   host: Config.DB.DB_HOST,
      //   user: Config.DB.DB_USER,
      //   password: Config.DB.DB_PW,
      //   database: Config.DB.DB_SCHAME
      // },
      client: 'sqlite3',
      connection: {
        filename: Config.DB.filePath
      },
      debug: isDev(),
      useNullAsDefault: true
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
   * 获取群通用配置
   * @param { knex } table
   */
  @withTransaction
  async getGroupConfig(table, groupId) {
    const result = await table('group_config')
      .first()
      .select('config')
      .where('group_id', groupId);
    return result ? JSON.parse(result.config) : null;
  }

  /**
   * 插入群通用配置
   * @param { knex } table
   */
  @withTransaction
  async insertGroupConfig(table, groupId, config) {
    await table('group_config')
      .insert({ group_id: groupId, config: JSON.stringify(config) })
      .where('group_id', groupId);
  }

  /**
   * 更新群通用配置
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
   * 获取全部群插件配置
   * @param { knex } table
   */
  @withTransaction
  getAllGroupPluginConfig(table) {
    return table('plugin_group_config').select({
      groupId: 'group_id',
      pluginList: 'plugin_list'
    });
  }

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
   * 插入群插件配置
   * @param { knex } table
   */
  @withTransaction
  insertGroupPluginConfig(table, groupId, pluginList) {
    const listString = pluginList.join(' ');
    return table('plugin_group_config').insert({
      group_id: groupId,
      plugin_list: listString
    });
  }

  /**
   * 更新群插件配置
   * @param { knex } table
   */
  @withTransaction
  updateGroupPluginConfig(table, groupId, pluginList) {
    const listString = pluginList.join(' ');
    return table('plugin_group_config')
      .update('plugin_list', listString)
      .where('group_id', groupId);
  }
}

export default new DBService();
