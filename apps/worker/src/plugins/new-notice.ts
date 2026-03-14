import D1Service from '@/services/d1-service';
import QQService from '@/services/qq-service';
import { PluginBase, type IncomingEvent } from '@/decorators/types';
import { OB11NoticeType } from '@/types/onebot11';
import { Plugin } from '../decorators/plugin';
import logger from '../utils/logger';

const defaultMsg = (name: string) => `欢迎 ${name} 加入本群! 请使用"!help"查看可用指令~`;
type GroupIncreaseNoticeEvent = IncomingEvent & {
  post_type: 'notice';
  notice_type: OB11NoticeType.GroupIncrease;
  group_id: number;
  user_id: number;
};

@Plugin({
  name: 'new-notice',
  weight: 99,
  type: 'notice',
  default: true,
  shortInfo: '入群提醒',
  info: '入群提醒'
})
class NewNotice extends PluginBase {
  // ==========================================
  // D1 数据操作
  // ==========================================

  async getTemplate(groupId: number): Promise<string | null | undefined> {
    const row = await D1Service.first('SELECT template FROM new_notice WHERE group_id = ?', [
      groupId
    ]) as { template?: string } | null;
    return row?.template;
  }

  async setTemplate(groupId: number, template: string) {
    return D1Service.query(
      `INSERT INTO new_notice (group_id, template, updated_at) VALUES (?, ?, strftime('%s', 'now'))
       ON CONFLICT(group_id) DO UPDATE SET template = excluded.template, updated_at = excluded.updated_at`,
      [groupId, template]
    );
  }

  // ==========================================
  // 业务逻辑
  // ==========================================

  isGroupIncreaseNotice(body: IncomingEvent): body is GroupIncreaseNoticeEvent {
    return body.post_type === 'notice' && body.notice_type === OB11NoticeType.GroupIncrease;
  }

  async go(body: IncomingEvent) {
    if (!this.isGroupIncreaseNotice(body)) {
      return;
    }
    const { group_id: groupId, user_id: userId } = body;
    logger.info(`群 ${groupId} 有新成员 ${userId} 加入, 正在查询昵称...`);
    const memberInfo = await QQService.getGroupMemberInfo(groupId, userId, true);
    const memberName = memberInfo.card || memberInfo.nickname;
    if (!memberName) return;
    const template = await this.getTemplate(groupId);
    const msg = template ? this.convertMsg(template, memberName) : defaultMsg(memberName);
    logger.info(`向${userId}: ${memberName}, 发送欢迎入群消息: ${msg}`);
    QQService.sendGroupMessage(groupId, msg);
    return 'break';
  }

  convertMsg(msg: string, memberName: string) {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: ignore
    return msg.replace('${name}', memberName);
  }
}

export default NewNotice;
