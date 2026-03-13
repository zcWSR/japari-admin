import KVService from '@/services/kv-service';
import QQService from '@/services/qq-service';
import Config from '../../config';
import { Command, LEVEL } from '../../decorators/plugin';
import type { CommandEvent, CommandMap, PluginEvent, PluginPostTypeLike } from '../types';

const ADMIN_TOKEN_KEY_PREFIX = 'admin-token:';
const TTL = 300; // 5 分钟

@Command({
  name: '管理后台链接',
  command: 'setting',
  type: 'group',
  info: '获取管理后台一次性配置链接（5 分钟内有效），仅群管可用',
  level: LEVEL.ADMIN
})
class SettingCommand {
  async run(_params: string, body: CommandEvent) {
    const { group_id: groupId, user_id: adminId } = body;
    const base = (Config.ADMIN_BASE_URL || '').replace(/\/$/, '');
    if (!base) {
      QQService.sendGroupMessage(groupId, '未配置 ADMIN_BASE_URL，无法生成链接');
      return;
    }
    const token = crypto.randomUUID();
    await KVService.setJSON(
      `${ADMIN_TOKEN_KEY_PREFIX}${token}`,
      {
        groupId: String(groupId),
        adminId: String(adminId),
        used: false
      },
      TTL
    );
    const url = `${base}/manage/token/${token}`;
    QQService.sendGroupMessage(groupId, `请在 5 分钟内打开链接完成配置：\n${url}`);
  }
}

export default SettingCommand;
