import { GroupCommandBase } from '@/decorators/types';
import KVService from '@/services/kv-service';
import QQService from '@/services/qq-service';
import type { OB11GroupMessage } from '@/types/onebot11';
import Config from '../../config';
import { Command, LEVEL } from '../../decorators/plugin';

const ADMIN_TOKEN_KEY_PREFIX = 'admin-token:';
const TTL = 300; // 5 分钟

@Command({
  name: '管理后台链接',
  command: 'setting',
  type: 'group',
  info: '获取管理后台一次性配置链接（5 分钟内有效），仅群管可用',
  level: LEVEL.ADMIN
})
class SettingCommand extends GroupCommandBase {
  async run(_params: string, body: OB11GroupMessage) {
    const { group_id: groupId, user_id: adminId } = body;
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
    const url = `${Config.HOST_BASE_URL}/manage/token/${token}`;
    QQService.sendGroupMessage(groupId, `请在 5 分钟内打开链接完成配置：\n${url}`);
  }
}

export default SettingCommand;
