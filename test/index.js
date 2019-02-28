import DBService from '../services/db-service';

async function test() {
  await DBService.checkTables();
  // await DBService.updateGroupPluginConfig(111, [222, 333, 4444]);
  await DBService.getGroupPluginConfig(111);
  await DBService.updateGroupPluginConfig(111, [111, 222, 333, 4444]);
}

test();
