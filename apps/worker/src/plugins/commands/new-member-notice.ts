import { GroupCommandBase } from '@/decorators/types';
import D1Service from '@/services/d1-service';
import QQService from '@/services/qq-service';
import type { OB11GroupMessage } from '@/types/onebot11';
import { Command, LEVEL } from '../../decorators/plugin';

// biome-ignore lint/suspicious/noTemplateCurlyInString: ignore
const DEFAULT_TPL = '欢迎 ${name} 加入本群! 请使用"!help"查看可用指令~';

@Command({
  name: '配置入群提醒模板',
  command: 'newNotice',
  type: 'group',
  // biome-ignore lint/suspicious/noTemplateCurlyInString: ignore
  info: "查看当前或设置当前群的入群提醒模板, '!newNotice'来查看, '!newNotice set xxx'来设置, 模板中可使用'${name}'来代替入群人昵称",
  level: LEVEL.ADMIN
})
class NewNotice extends GroupCommandBase {
  // ==========================================
  // D1 数据操作
  // ==========================================

  async getTemplate(groupId: number) {
    const row = (await D1Service.first('SELECT template FROM new_notice WHERE group_id = ?', [
      groupId
    ])) as { template?: string } | null;
    return row?.template as string | undefined;
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

  getValue(params: string) {
    const match = params.match(/^(\w+)\s(.*)/);
    if (!match) {
      return {
        key: match?.[1] || null,
        value: null
      };
    }
    return {
      key: match[1],
      value: match[2]
    };
  }

  async run(params: string, body: OB11GroupMessage) {
    const { group_id: groupId } = body;
    const template = await this.getTemplate(groupId);
    if (!params) {
      if (template) {
        QQService.sendGroupMessage(groupId, `当前模板内容:\n'${template}'`);
      } else {
        QQService.sendGroupMessage(groupId, `未设置自定义模板, 以下为默认模板:\n'${DEFAULT_TPL}'`);
      }
      return;
    }
    const { key, value } = this.getValue(params);
    if (key !== 'set') {
      QQService.sendGroupMessage(groupId, `非法参数'${key || 'null'}'`);
      return;
    }
    if (!value) {
      QQService.sendGroupMessage(groupId, '不可设置空模板');
      return;
    }
    await this.setTemplate(groupId, value);
    QQService.sendGroupMessage(groupId, '设置成功!');
  }
}

export default NewNotice;
