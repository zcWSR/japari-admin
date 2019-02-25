import { createWithLog } from '../decorators/db';
import { Plugin } from '../decorators/plugin';
import logger from '../utils/logger';

@Plugin({
  name: 'command-runner',
  weight: 99,
  category: 'all'
})
class CommandRunner {
  info = '相应多种指令, 具体指令集见 commands/目录';

  go(info) {
    logger.info(info);
  }

  @createWithLog('group_command_list')
  async createTable(table) {
    table.bigInteger('group_id');
    table.string('command_list');
  }
}

export default CommandRunner;
