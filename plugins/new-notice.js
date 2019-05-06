import { withTransaction } from '../decorators/db';
import { Plugin } from '../decorators/plugin';
import QQService from '../services/qq-service';
import logger from '../utils/logger';

const defaultMsg = name => `欢迎 ${name} 加入本群! 请使用"!help"查看可用指令~`;

@Plugin({
  name: 'new-notice',
  weight: 99,
  type: 'notice',
  default: true,
  info: '入群提醒, 暂时不可配置'
})
class NewNotice {
  async go(body) {
    const { event, gourp_id: groupId, user_id: userId } = body;
    if (event !== 'group_increase') return 'break';
    logger.info(`群 ${groupId} 有新成员 ${userId} 加入, 正在查询昵称...`);
    const memberName = await QQService.getGroupMemberName(groupId, userId);
    if (!memberName) return 'break';
    const template = await this.getTemplate(groupId);
    let msg;
    if (template) {
      msg = this.convertMsg(template, memberName);
    } else {
      msg = defaultMsg(memberName);
    }
    logger.info(`向${userId}: ${memberName}, 发送欢迎入群消息: ${msg}`);
    QQService.sendGroupMessage(groupId, msg);
    return true;
  }

  convertMsg(msg, memberName) {
    // eslint-disable-next-line no-template-curly-in-string
    return msg.replace('${name}', memberName);
  }

  @withTransaction
  async createTable(trx) {
    if (!(await trx.schema.hasTable('new-notice'))) {
      await trx.schema.createTable('new-notice', (table) => {
        table.bigInteger('group_id').primary();
        table.string('template');
      });
    }
  }

  @withTransaction
  async getTemplate(trx, groupId) {
    const result = await trx('new-notice')
      .first()
      .select('template')
      .where('group_id', groupId);
    return (result || {}).template;
  }
}

export default NewNotice;
