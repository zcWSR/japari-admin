import { createWithLog } from '../decorators/db';
import Plugin from './base-plugin';
import logger from '../utils/logger';

export default class CommandRunner extends Plugin {
  name = '指令解析';
  weight = 99;
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
