import { withTransaction } from '../decorators/db';
import { Plugin } from '../decorators/plugin';
import OSUService from '../services/osu-service';

@Plugin({
  name: 'osu-db-loader',
  weight: 1,
  type: null, // 类型为空, 不添加到插件队列内
  mute: true
})
class OSUDBLoader {
  init() {
    OSUService.setDBInstance(this.DBInstance);
  }

  @withTransaction
  async createTable(trx) {
    if (!(await trx.schema.hasTable('osu_bind'))) {
      await trx.schema.createTable('osu_bind', (table) => {
        table.increments('id').primary();
        table.integer('user_id');
        table.integer('group_id');
        table.integer('osu_id');
        table.string('osu_name');
        table.integer('mode');
      });
    }
    if (!(await trx.schema.hasTable('osu_map'))) {
      await trx.schema.createTable('osu_map', (table) => {
        table.integer('id');
        table.text('map');
      });
    }
  }
}

export default OSUDBLoader;
