import path from 'path';
import logger, { blockLog } from '../utils/logger';
import FileService from '../services/file-service';
import { withTransaction } from '../decorators/db';
import { Plugin } from '../decorators/plugin';
import QQService from '../services/qq-service';

const COMMAND_404 = "您所调用的指令不存在尝试使用, '!help'来查看所有可用指令";

@Plugin({
  name: 'command-runner',
  weight: 99,
  type: 'message',
  shortInfo: '指令响应',
  info: "响应群聊/私聊指令, 指令'!'或'！'开头",
  default: true,
  hide: true,
  mute: true
})
class CommandRunner {
  command = {
    private: {},
    group: {}
  };

  /**
   * 指令分类
   * @param {any} command 指令对象
   */
  classifyCommand(command) {
    if (command.type === 'all' || command.type === 'private') {
      logger.debug(`type is '${command.type}', load into private command list`);
      this.command.private[command.command] = command;
    }
    if (command.type === 'all' || command.type === 'group') {
      logger.debug(`type is '${command.type}', load into group command list`);
      this.command.group[command.command] = command;
    }
  }

  async init() {
    blockLog(['CommandRunner', 'v1.0'], 'info', '@', 0, 10);
    logger.info('======== start load command  ========');
    // eslint-disable-next-line no-restricted-syntax
    for (const file of FileService.getDirFiles(path.resolve(__dirname, 'commands'))) {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const required = require(file.path);
      if (!required || !required.default) {
        logger.warn('wrong command constructor!!!!!, skip');
        logger.warn(`check file at: ${file.path}`);
        continue;
      }
      const Command = required.default;
      const command = new Command();
      if (!command.name) throw Error('command require a name');
      command.setDBInstance(this.DBInstance);
      if (command.createTable) {
        logger.debug('create command require database');
        await command.createTable();
      }
      if (command.init) {
        logger.debug('init command');
        await command.init();
      }
      this.classifyCommand(command);
      logger.info(`load command '${command.command}' complete`);
    }
    logger.info('======== all command loaded  ========');
  }

  /**
   * 判断是否为指令调用内容, 返回指令和参数
   * @param {string} content 完整内容
   */
  isCommand(content) {
    let match = content.match(/^[!|\uff01]([a-zA-Z]{2,})\s(.*)$/);
    if (match) {
      const [, name, params] = match;
      return { name, params: params.trim() };
    }
    // 对无参数指令做分别处理, 防止出现!recent1 类似这样不加空格也能匹配成功的问题
    match = content.match(/^[!|\uff01]([a-zA-Z]{2,})$/);
    if (!match) return null;
    return {
      name: match[1],
      params: ''
    };
  }

  groupCommand(body, command, type) {
    const commandInstance = this.command.group[command.name];
    if (!commandInstance) {
      QQService.sendGroupMessage(body.group_id, COMMAND_404);
      return;
    }
    return commandInstance.trigger(command.params, body, type, this.command.group);
  }

  privateCommand(body, command, type) {
    const commandInstance = this.command.private[command.name];
    if (!commandInstance) {
      QQService.sendPrivateMessage(body.user_id, COMMAND_404);
      return;
    }
    return commandInstance.trigger(command.params, body, type, this.command.private);
  }

  async go(body, type) {
    const { message } = body;
    const c = this.isCommand(message);
    if (!c) return; // 不是指令, 直接跳过流程
    switch (type) {
      case 'group':
        await this.groupCommand(body, c, type);
        break;
      case 'private':
        await this.privateCommand(body, c, type);
        break;
      default:
    }
    return 'break';
  }

  // @withTransaction
  // async createTable(trx) {
  //   if (!(await trx.schema.hasTable('group_command_list'))) {
  //     await trx.schema.createTable('group_command_list', (table) => {
  //       table.bigInteger('group_id').primary();
  //       table.string('command_list');
  //     });
  //   }
  // }
}

export default CommandRunner;
