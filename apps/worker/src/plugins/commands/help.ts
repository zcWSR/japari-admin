import { CommandBase, type CommandMap } from '@/decorators/types';
import QQService from '@/services/qq-service';
import type { OB11Message } from '@/types/onebot11';
import { Command } from '../../decorators/plugin';

@Command({
  name: '帮助',
  command: 'help',
  type: 'all',
  info: "用来查看所有指令或者某特定指令的使用方法的指令, '!help 指令名' 来调用"
})
class Help extends CommandBase {
  getCommandInstance(commandName: string, body: OB11Message, commandMap: CommandMap) {
    const isAdmin = QQService.isSuperAdmin(body.user_id);
    const commandInstance = commandMap[commandName];
    if (commandInstance === this) {
      // 忽略自身
      return null;
    }
    if (commandInstance.level === 3) {
      // 如为管理员专属指令, 则判断用户权限
      return isAdmin ? commandInstance : null;
    }
    return commandInstance;
  }

  showOne(commandName: string, body: OB11Message, commandMap: CommandMap) {
    const instance = this.getCommandInstance(commandName, body, commandMap);
    if (instance) {
      const { name, command, info } = instance;
      const cmd = Array.isArray(command) ? command.join('|') : command;
      return `指令名: ${name}\ncommand: ${cmd}\n描述: ${info || '无描述'}`;
    }
    return `指令'${commandName}'不存在或被隐藏`;
  }

  showAll(body: OB11Message, commandMap: CommandMap) {
    let content = "可用指令: (使用'!help 指令名'可查看详细用法)";
    const commands = Object.keys(commandMap).map((name) =>
      this.getCommandInstance(name, body, commandMap)
    );
    const commendSet = new Set(commands);
    commendSet.forEach((instance) => {
      if (instance) {
        const cmd = Array.isArray(instance.command) ? instance.command.join('|') : instance.command;
        content += `\n!${cmd}  ${instance.name || ''}`;
      }
    });
    return content;
  }

  run(params: string, body: OB11Message, commandMap: CommandMap) {
    const commandName = params;
    let content: string;
    if (commandName) {
      content = this.showOne(commandName, body, commandMap);
    } else {
      content = this.showAll(body, commandMap);
    }
    QQService.sendMessage(body, content);
  }
}

export default Help;
