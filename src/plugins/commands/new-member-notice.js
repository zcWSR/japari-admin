import { Command, LEVEL } from '../../decorators/plugin';
import { withTransaction } from '../../decorators/db';
import QQService from '../../services/qq-service';

// eslint-disable-next-line no-template-curly-in-string
const DEFAULT_TPL = '欢迎 ${name} 加入本群! 请使用"!help"查看可用指令~';

@Command({
  name: '配置入群提醒模板',
  command: 'newNotice',
  type: 'group',
  info:
  // eslint-disable-next-line no-template-curly-in-string
    "查看当前或设置当前群的入群提醒模板, '!newNotice'来查看, '!newNotice set xxx'来设置, 模板中可使用'${name}'来代替入群人昵称",
  level: LEVEL.ADMIN
})
class NewNotice {
  getValue(params) {
    const match = params.match(/^(\w+)\s(.*)/);
    if (!match) {
      return {
        key: match,
        value: null
      };
    }
    return {
      key: match[1],
      value: match[2]
    };
  }

  @withTransaction
  async getTemplate(trx, groupId) {
    const result = await trx('new-notice')
      .first()
      .select('template')
      .where('group_id', groupId);
    return (result || {}).template;
  }

  @withTransaction
  async setTemplate(trx, groupId, template) {
    const exist = !!(await trx('new-notice')
      .where({ group_id: groupId })
      .first());
    if (exist) {
      await trx('new-notice')
        .update({ template })
        .where('group_id', groupId);
    } else {
      await trx('new-notice').insert({ template, group_id: groupId });
    }
  }

  async run(params, body) {
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
