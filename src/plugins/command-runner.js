import path from 'path';
import { decode } from 'html-entities';
// import { withTransaction } from '../decorators/db';
import { Plugin } from '../decorators/plugin';
import FileService from '../services/file-service';
import QQService from '../services/qq-service';
import { extractFirstText } from '../utils/message';
import logger, { blockLog } from '../utils/logger';

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
      if (Array.isArray(command.command)) {
        command.command.forEach((name) => {
          this.command.private[name] = command;
        });
      } else {
        this.command.private[command.command] = command;
      }
    }
    if (command.type === 'all' || command.type === 'group') {
      logger.debug(`type is '${command.type}', load into group command list`);
      if (Array.isArray(command.command)) {
        command.command.forEach((name) => {
          this.command.group[name] = command;
        });
      } else {
        this.command.group[command.command] = command;
      }
    }
  }

  async init() {
    blockLog(['CommandRunner', 'v1.0'], 'info', '@', 0, 10);
    logger.info('======== start load command  ========');
    for (const file of FileService.getDirFiles(path.resolve(__dirname, 'commands'))) {
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
   * @param {Array|string} message 消息段数组或字符串
   */
  isCommand(message) {
    // 从消息段数组提取第一个 text 段的内容
    const content = extractFirstText(message);
    if (!content) return null;

    let match = content.match(/^[!|\uFF01]([\u4e00-\u9fa5_a-zA-Z0-9_]{2,})\s([\0-\uFFFF]*)$/);
    if (match) {
      const [, name, params] = match;
      // 需要 html decode，发现标点符号会被转译
      return { name, params: decode(params.trim()) };
    }
    // 对无参数指令做分别处理, 防止出现!recent1 类似这样不加空格也能匹配成功的问题
    match = content.match(/^[!|\uff01]([\u4e00-\u9fa5_a-zA-Z0-9_]{2,})$/);
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
}

export default CommandRunner;
