
import { withTransaction } from '../decorators/db';
import { Plugin } from '../decorators/plugin';
import logger from '../utils/logger';
import QQService from '../services/qq-service';

@Plugin({
  name: 'command-runner',
  weight: 99,
  type: 'message',
  default: true,
  mute: true
})
class CommandRunner {
  info = "响应群聊/私聊指令, 指令'!'或'！'开头";

  /**
   * 判断是否为指令调用内容, 返回指令和参数
   * @param {string} content 完整内容
   */
  isCommand(content) {
    let match = content.match(/^[!|\uff01]([a-zA-Z]{2,})\s(.*)$/);
    if (match) {
      return {
        name: match[1],
        params: match[2]
      };
    }
    // 对无参数指令做分别处理, 防止出现!recent1 类似这样不加空格也能匹配成功的问题
    match = content.match(/^[!|\uff01]([a-zA-Z]{2,})$/);
    if (!match) return null;
    return {
      name: match[1],
      params: ''
    };
  }

  async go(body) {
    const { group_id: groupId, user_id: userId, message } = body;
    logger.info('message', message);
    QQService.sendGroupMessage(
      groupId,
      `${userId}你所调用的指令不存在, 尝试使用'!help'来查看所有可用指令`
    );
    // const c = this.isCommand(message);
    // if (!c) return;
    // const command = commandMap[c.name];
    // if (command) {
    //   logger.info(`群${groupId}, qq${userId}, 调用指令: !${c.name}, 参数: ${c.params}`);
    //   command.exec(c.params, body);
    // } else {
    //   QQService.sendGroupMessage(
    //     groupId,
    //     "你所调用的指令不存在, 尝试使用'!help'来查看所有可用指令"
    //   );
    // }
    return 'break';
  }

  @withTransaction
  async createTable(trx) {
    if (!(await trx.schema.hasTable('group_command_list'))) {
      await trx.schema.createTable('group_command_list', (table) => {
        table.bigInteger('group_id').primary();
        table.string('command_list');
      });
    }
  }
}

export default CommandRunner;

// export function loadCommands() {
//   const cmsDirPath = path.resolve(__dirname, 'commands');
//   logger.info('================command-loader================');
//   const cmsFilePath = fs.readdirSync(cmsDirPath)
//   .map(filename => {
//     return `${cmsDirPath}/${filename}`;
//   });
//   const commands = cmsFilePath.reduce((prev, curr) => {
//     let cm;
//     try {
//       cm = require(curr);
//       if (cm.name) {
//         prev[cm.name] = cm;
//         logger.info(`指令'!${cm.name}' 加载成功`);
//       } else {
//         throw new Error(`插件加载失败,缺少必要属性'name'\n位于: ${curr}`);
//       }
//     } catch (e) {
//       logger.info(e);
//     }
//     return prev;
//   }, {});
//   logger.info('指令加载完成');
//   logger.info('================command-loader================');
//   return commands;
// }
