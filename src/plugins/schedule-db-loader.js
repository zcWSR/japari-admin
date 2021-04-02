import { Plugin } from '../decorators/plugin';
import { withTransaction } from '../decorators/db';
import ScheduleService from '../services/schedule-service';

@Plugin({
  name: 'schedule-db-loader',
  weight: 1,
  type: null, // 类型为空, 不添加到插件队列内
  mute: true
})
class ScheduleDBLoader {
  init() {
    ScheduleService.setDBInstance(this.DBInstance);
  }

  @withTransaction
  async createTable(trx) {
    if (await trx.schema.hasTable('schedule')) return;
    return trx.schema.createTable('schedule', (table) => {
      table.integer('group_id').primary();
      table.string('name');
      table.string('rule');
      table.string('text');
    });
  }
}

export default ScheduleDBLoader;
