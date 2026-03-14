import { PluginBase } from '@/decorators/types';
import KVService from '@/services/kv-service';
import QQService from '@/services/qq-service';
import ReadAgainService from '@/services/read-again-service';
import type { OB11GroupMessage, OB11Segment } from '@/types/onebot11';
import { Plugin } from '../decorators/plugin';
import logger from '../utils/logger';
import { formatForLog, isSegmentEqual } from '../utils/message';
import { sleep } from '../utils/process';

type FollowState = {
  message: OB11Segment[] | string | null;
  count: number;
};

const DEFAULT_GROUP_INFO: FollowState = { message: null, count: 1 };

@Plugin({
  name: 'read-again-follow',
  weight: 98,
  type: 'group',
  shortInfo: '跟随复读',
  info: '当同一群聊连续出现相同消息三次时, 进行复读',
  default: true,
  mute: true
})
class ReadAgainFollow extends PluginBase {
  // ==========================================
  // KV 数据操作
  // ==========================================

  getStateKey(groupId: number) {
    return `read-again-follow-${groupId}`;
  }

  async getState(groupId: number): Promise<FollowState | null> {
    return KVService.getJSON(this.getStateKey(groupId));
  }

  async setState(groupId: number, state: FollowState) {
    return KVService.setJSON(this.getStateKey(groupId), state);
  }

  // ==========================================
  // 业务逻辑
  // ==========================================

  // 判断和前一条是否相似
  isSimilar(a: FollowState['message'], b: FollowState['message']) {
    try {
      // 兼容旧数据：如果存储的是字符串或 null
      if (!a || !b) return false;
      if (typeof a === 'string' || typeof b === 'string') {
        return a === b;
      }
      if (!Array.isArray(a) || !Array.isArray(b)) {
        return false;
      }
      // 段落数量不同，直接不相似
      if (a.length !== b.length) {
        return false;
      }

      return a.every((segA, index) => {
        const segB = b[index];
        // 类型不同，不相似
        if (segA.type !== segB.type) {
          return false;
        }
        // 文字段：相似度比较
        if (segA.type === 'text' && segB.type === 'text') {
          return ReadAgainService.similar(segA.data.text || '', segB.data.text || '');
        }
        // 非文字段（image/at/face/record 等）：全等比较 data
        return isSegmentEqual(segA, segB);
      });
    } catch (e) {
      logger.error('get similar message error:');
      logger.error(e);
      return false;
    }
  }

  async go(body: OB11GroupMessage) {
    const { group_id: groupId, message } = body;
    let groupInfo = (await this.getState(groupId)) || DEFAULT_GROUP_INFO;
    if (!this.isSimilar(groupInfo.message, message)) {
      groupInfo = { message, count: 1 };
      await this.setState(groupId, groupInfo);
      return;
    }
    groupInfo.count += 1;
    if (!(groupInfo.count % 3)) {
      logger.info(`group ${groupId} read follow: '${formatForLog(message)}'`);
      await sleep();
      QQService.sendGroupMessage(groupId, message);
      await this.setState(groupId, groupInfo);
      return 'break';
    }
    await this.setState(groupId, groupInfo);
  }
}

export default ReadAgainFollow;
