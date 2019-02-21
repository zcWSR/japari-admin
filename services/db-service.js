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

  // async function createQQBotTable() {
  // if (await DBInstance.schema.hasTable('qqbot')) return;
  // await DBInstance.schema
  //   .createTable('qqbot', (table) => {
  //     table.bigInteger('group_id').primary();
  //     table.text('config');
  //   })
  //   .then(() => {
  //     logger.info("table 'qqbot' 準備完了");
  //   })
  //   .catch((err) => {
  //     logger.error(err);
  //   });
  // }

  @createWithLog('osu_bind')
  createOSUBindTable(table) {
    table.increments('id').primary();
    table.bigInteger('user_id');
    table.bigInteger('group_id');
    table.bigInteger('osu_id');
    table.string('osu_name');
    table.integer('mode');
  }

  @createWithLog('osu_map')
  createOSUMapTable(table) {
    table.bigInteger('id');
    table.text('map');
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

const dbService = new DBService();

export default dbService;
