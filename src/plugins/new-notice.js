import { Plugin } from '../decorators/plugin';
import D1Service from '../services/d1-service';
import QQService from '../services/qq-service';
import logger from '../utils/logger';

const defaultMsg = (name) => `欢迎 ${name} 加入本群! 请使用"!help"查看可用指令~`;

@Plugin({
  name: 'new-notice',
  weight: 99,
  type: 'notice',
  default: true,
  shortInfo: '入群提醒',
  info: '入群提醒'
})
class NewNotice {
  // ==========================================
  // D1 数据操作
  // ==========================================

  async getTemplate(groupId) {
    const row = await D1Service.first('SELECT template FROM new_notice WHERE group_id = ?', [
      groupId
    ]);
    return row?.template;
  }

  async setTemplate(groupId, template) {
    return D1Service.query(
      `INSERT INTO new_notice (group_id, template, updated_at) VALUES (?, ?, strftime('%s', 'now'))
       ON CONFLICT(group_id) DO UPDATE SET template = excluded.template, updated_at = excluded.updated_at`,
      [groupId, template]
    );
  }

  // ==========================================
  // 业务逻辑
  // ==========================================

  async go(body) {
    const { notice_type: noticeType, group_id: groupId, user_id: userId } = body;
    if (noticeType !== 'group_increase') return 'break';
    logger.info(`群 ${groupId} 有新成员 ${userId} 加入, 正在查询昵称...`);
    const memberName = await QQService.getGroupUserName(groupId, userId, true);
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
    return msg.replace('${name}', memberName);
  }
}

export default NewNotice;
