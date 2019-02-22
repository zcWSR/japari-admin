import knex from 'knex';
import {
  DB_HOST, DB_USER, DB_PW, DB_SCHAME
} from '../config';
import logger from '../utils/logger';
import { createWithLog } from '../decorators/db';

class DBService {
  constructor() {
    this.DBInstance = knex({
      client: 'mysql',
      connection: {
        host: DB_HOST,
        user: DB_USER,
        password: DB_PW,
        database: DB_SCHAME
      }
    });
  }

  // async createQQBotTable() {
  //   if (await this.DBInstance.schema.hasTable('qqbot')) return;
  //   await this.DBInstance.schema
  //     .createTable('qqbot', (table) => {
  //       table.bigInteger('group_id').primary();
  //       table.string('config');
  //     })
  //     .then(() => {
  //       logger.info("table 'qqbot' 準備完了");
  //     })
  //     .catch((err) => {
  //       logger.error(err);
  //     });
  // }

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

  async checkTables() {
    try {
      await Promise.all([
        // this.createQQBotTable(),
        this.createOSUBindTable(),
        this.createOSUMapTable()
      ]);
      logger.info('all table prepared');
    } catch (e) {
      logger.error(e);
    }
  }
}

export default new DBService();
