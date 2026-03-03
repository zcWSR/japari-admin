import axios from 'axios';
import type { OB11MessageData } from '@/types/onebot11';
import { OB11MessageDataType } from '@/types/onebot11';
import Config from '../config';
import { formatShangHaiTime } from '../utils/date';
import { isDev } from '../utils/env';
import logger from '../utils/logger';
import { formatForLog, type MessageInput } from '../utils/message';
import { sleep } from '../utils/process';

type AuthLevel = 'owner' | 'admin';

interface CapturedSentItem {
  type: string;
  id: string;
  message: OB11MessageData[] | string;
}

class QQService {
  /** 模拟时收集本请求内通过 sendGroupMessage/sendPrivateMessage 发送的内容，供界面展示 */
  _captureSent: CapturedSentItem[] | null = null;

  constructor() {
    if (isDev()) {
      this.sendGroupMessage = (groupId: string | number, msg: MessageInput) => {
        this._pushSent('group', String(groupId), msg);
        logger.debug(`===== send to group ${groupId}`);
        logger.debug(formatForLog(msg));
        logger.debug('===== done');
      };
      this.sendPrivateMessage = (userId: string | number, msg: MessageInput) => {
        this._pushSent('private', String(userId), msg);
        logger.debug(`===== send to user ${userId}`);
        logger.debug(formatForLog(msg));
        logger.debug('===== done');
      };
    }
  }

  _pushSent(type: string, id: string, message: OB11MessageData[] | string): void {
    if (!this._captureSent) return;
    this._captureSent.push({ type, id, message });
  }

  /** 开始收集本次请求的发送记录，用于消息模拟界面展示 */
  startCapture(): void {
    this._captureSent = [];
  }

  /** 返回并清空本次收集的发送记录 */
  getCapturedAndClear(): CapturedSentItem[] {
    const out = this._captureSent ?? [];
    this._captureSent = null;
    return out;
  }

  async getGroupList(): Promise<unknown> {
    const list = await axios.post(`${Config.QQ_SERVER}/get_group_list`);
    return list;
  }

  isSuperAdmin(userId: string | number): boolean {
    return Config.ADMINS.includes(Number(userId));
  }

  async isGroupOwner(groupId: string | number, userId: string | number): Promise<boolean> {
    return (await this.getGroupUserRole(groupId, userId)) === 'owner';
  }

  async isGroupAdminOrOwner(groupId: string | number, userId: string | number): Promise<boolean> {
    const role = await this.getGroupUserRole(groupId, userId);
    return role === 'admin' || role === 'owner';
  }

  async getGroupUserRole(
    groupId: string | number,
    userId: string | number
  ): Promise<string | null> {
    try {
      const meta = await axios.post<{ data?: { role?: string; user_id?: unknown } }>(
        `${Config.QQ_SERVER}/get_group_member_info`,
        { group_id: groupId, user_id: userId }
      );
      const memberInfo = meta.data?.data as { role?: string; user_id?: unknown } | undefined;
      if (!memberInfo || memberInfo.user_id == null) return null;
      return memberInfo.role ?? null;
    } catch (e) {
      logger.error(`get group(${groupId}) user(${userId}) role error`);
      logger.error(e);
      return null;
    }
  }

  async getGroupUserName(
    groupId: string | number,
    userId: string | number,
    noCache = false
  ): Promise<string | null> {
    try {
      const meta = await axios.post<{ data?: { nickname?: string } }>(
        `${Config.QQ_SERVER}/get_group_member_info`,
        { group_id: groupId, user_id: userId, no_cache: noCache }
      );
      const memberInfo = meta.data?.data as { nickname?: string } | undefined;
      return memberInfo?.nickname ?? null;
    } catch (e) {
      logger.error(`get group(${groupId}) user(${userId}) name error`);
      logger.error(e);
      return null;
    }
  }

  /** NapCat/OneBot get_group_info，返回群名等 */
  async getGroupInfo(
    groupId: string | number
  ): Promise<{ group_name?: string } | null> {
    try {
      const meta = await axios.post<{ data?: { group_name?: string } }>(
        `${Config.QQ_SERVER}/get_group_info`,
        { group_id: groupId }
      );
      const data = meta.data?.data as { group_name?: string } | undefined;
      return data ?? null;
    } catch (e) {
      logger.error(`get group(${groupId}) info error`);
      logger.error(e);
      return null;
    }
  }

  sendPrivateMessage(userId: string | number, message: MessageInput): void {
    const msg: OB11MessageData[] =
      typeof message === 'string'
        ? [{ type: OB11MessageDataType.text, data: { text: message } }]
        : message;
    this._pushSent('private', String(userId), msg);
    axios.post(`${Config.QQ_SERVER}/send_private_msg`, { user_id: userId, message: msg });
  }

  sendPrivateMusic(userId: string | number, musicId: string | number): void {
    this.sendPrivateMessage(userId, [
      {
        type: OB11MessageDataType.music,
        data: { type: '163', id: String(musicId) }
      }
    ]);
  }

  sendPrivateImage(
    userId: string | number,
    dataUrl: string,
    option: { isBase64?: boolean } = { isBase64: false }
  ): void {
    this.sendPrivateMessage(userId, [
      {
        type: OB11MessageDataType.image,
        data: { file: option.isBase64 ? `base64://${dataUrl}` : dataUrl }
      }
    ]);
  }

  sendGroupMessage(groupId: string | number, message: MessageInput): void {
    const msg: OB11MessageData[] =
      typeof message === 'string'
        ? [{ type: OB11MessageDataType.text, data: { text: message } }]
        : message;
    this._pushSent('group', String(groupId), msg);
    axios.post(`${Config.QQ_SERVER}/send_group_msg`, { group_id: groupId, message: msg });
  }

  sendGroupImage(
    groupId: string | number,
    dataUrl: string,
    option: { isBase64?: boolean } = { isBase64: false }
  ): void {
    this.sendGroupMessage(groupId, [
      {
        type: OB11MessageDataType.image,
        data: { file: option.isBase64 ? `base64://${dataUrl}` : dataUrl }
      }
    ]);
  }

  sendGroupMusic(groupId: string | number, musicId: string | number): void {
    this.sendGroupMessage(groupId, [
      {
        type: OB11MessageDataType.music,
        data: { type: '163', id: String(musicId) }
      }
    ]);
  }

  banGroupUser(groupId: string | number, userId: string | number, duration: number): void {
    axios.post(`${Config.QQ_SERVER}/set_group_ban`, {
      group_id: groupId,
      user_id: userId,
      duration
    });
  }

  /**
   * 将接收到的 postType 转换成插件对应的 postType
   */
  convertMessageType(event: Record<string, unknown>): string {
    const postType = event.post_type as string | undefined;
    if (postType === 'message' || postType === 'message_sent') {
      return (event.message_type as string | undefined) ?? postType ?? '';
    }
    return postType ?? '';
  }

  async sendReadyMessage(): Promise<void> {
    const message = `服务(重)启动于: ${formatShangHaiTime()}`;
    logger.info(message);
    await this.sendAdminsMessage(message);
  }

  async sendAdminsMessage(message: MessageInput): Promise<void> {
    for (const admin of Config.ADMINS) {
      await this.sendPrivateMessage(admin, message);
      await sleep();
    }
  }

  authCheckFuncMap: Record<
    AuthLevel,
    (g: string | number, u: string | number) => Promise<boolean>
  > = {
    owner: this.isGroupOwner.bind(this),
    admin: this.isGroupAdminOrOwner.bind(this)
  };

  async checkRateWithMessage(
    rate: number,
    groupId: string | number,
    userId: string | number,
    min = 0,
    max = 1,
    rateNeedAuth = 0.5,
    authLevel: AuthLevel = 'owner'
  ): Promise<boolean> {
    if (Number.isNaN(rate)) {
      this.sendGroupMessage(groupId, '参数非法');
      return false;
    }
    if (rate < min) {
      this.sendGroupMessage(groupId, `不可设置小于${(min * 100).toFixed(0)}%的值`);
      return false;
    }
    if (rate > max) {
      this.sendGroupMessage(groupId, `不可设置大于${(max * 100).toFixed(0)}%的值`);
      return false;
    }
    if (rateNeedAuth && rate > rateNeedAuth) {
      if (await this.authCheckFuncMap[authLevel](groupId, userId)) {
        return true;
      }
      const level = authLevel === 'admin' ? '管理员及以上' : '群主';
      this.sendGroupMessage(
        groupId,
        `设置概率为${(rateNeedAuth * 100).toFixed(0)}%及以上仅${level}有权限`
      );
      return false;
    }
    return true;
  }
}

export default new QQService();
