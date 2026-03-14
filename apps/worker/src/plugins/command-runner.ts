import { decode } from 'html-entities';
import {
  type CommandBase,
  type CommandMap,
  PluginBase,
  type PluginPostType
} from '@/decorators/types';
import QQService from '@/services/qq-service';
import type { OB11Message } from '@/types/onebot11';
import { Plugin } from '../decorators/plugin';
import logger, { blockLog } from '../utils/logger';
import { extractFirstText } from '../utils/message';
import { commands as commandList } from './commands/registry';

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
class CommandRunner extends PluginBase {
  command = {
    private: {} as CommandMap,
    group: {} as CommandMap
  };

  /**
   * 指令分类
   * @param {any} command 指令对象
   */
  classifyCommand(command: CommandBase) {
    if (command.type === 'all' || command.type === 'private') {
      logger.debug(`type is '${command.type}', load into private command list`);
      if (Array.isArray(command.command)) {
        command.command.forEach((name: string) => {
          this.command.private[name] = command;
        });
      } else {
        this.command.private[command.command] = command;
      }
    }
    if (command.type === 'all' || command.type === 'group') {
      logger.debug(`type is '${command.type}', load into group command list`);
      if (Array.isArray(command.command)) {
        command.command.forEach((name: string) => {
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
    for (const C of commandList) {
      const command: CommandBase = new C();
      if (!command || !command.name) {
        logger.warn('invalid command in registry, skip');
        continue;
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
  isCommand(message: OB11Message['message']) {
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

  runCommand(body: OB11Message, command: { name: string; params: string }, type: PluginPostType) {
    const commandMap = type === 'group' ? this.command.group : this.command.private;
    const commandInstance = commandMap[command.name];
    if (!commandInstance) {
      QQService.sendMessage(body, COMMAND_404);
      return;
    }
    return commandInstance.trigger(command.params, body, commandMap);
  }

  async go(body: OB11Message) {
    const { message, message_type } = body;
    const c = this.isCommand(message);
    if (!c) return; // 不是指令, 直接跳过流程
    if (message_type === 'group' || message_type === 'private') {
      await this.runCommand(body, c, message_type);
    }
    return 'break';
  }
}

export default CommandRunner;
