import axios from 'axios';
import type { IncomingEvent, PluginPostType } from '@/types/onebot';
import type {
  Action,
  GetGroupInfo,
  GetGroupMemberInfo,
  OB11Segment,
  RequestResponse
} from '@/types/onebot11';
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
  message: OB11Segment[] | string;
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

  _pushSent(type: string, id: string, message: OB11Segment[] | string): void {
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

  async getGroupList(): Promise<RequestResponse<Action.getGroupList>> {
    const list = await axios.post<RequestResponse<Action.getGroupList>>(
      `${Config.QQ_SERVER}/get_group_list`
    );
    return list.data;
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
  ): Promise<GetGroupMemberInfo['role'] | null> {
    try {
      const meta = await axios.post<RequestResponse<Action.getGroupMemberInfo>>(
        `${Config.QQ_SERVER}/get_group_member_info`,
        { group_id: groupId, user_id: userId }
      );
      const memberInfo = meta.data?.data;
      if (!memberInfo || memberInfo.user_id == null) return null;
      return memberInfo.role ?? null;
    } catch (e) {
      logger.error(`get group(${groupId}) user(${userId}) role error`);
      logger.error(e);
      return null;
    }
  }

  async getGroupMemberInfo(
    groupId: string | number,
    userId: string | number,
    noCache = false
  ): Promise<{ data: GetGroupMemberInfo } | { error: 'member_not_found' | 'service_error' }> {
    try {
      const meta = await axios.post<RequestResponse<Action.getGroupMemberInfo>>(
        `${Config.QQ_SERVER}/get_group_member_info`,
        { group_id: groupId, user_id: userId, no_cache: noCache }
      );
      const memberInfo = meta.data?.data;
      if (!memberInfo || memberInfo.user_id == null) {
        return { error: 'member_not_found' };
      }
      logger.debug(`get group(${groupId}) user(${userId}) member info:`, memberInfo);
      return { data: memberInfo };
    } catch (e) {
      logger.error(`get group(${groupId}) user(${userId}) member info error`);
      logger.error(e);
      return { error: 'service_error' };
    }
  }

  async getGroupUserName(
    groupId: string | number,
    userId: string | number,
    noCache = false
  ): Promise<string | null> {
    try {
      const meta = await axios.post<RequestResponse<Action.getGroupMemberInfo>>(
        `${Config.QQ_SERVER}/get_group_member_info`,
        { group_id: groupId, user_id: userId, no_cache: noCache }
      );
      const memberInfo = meta.data?.data;
      return memberInfo?.nickname ?? null;
    } catch (e) {
      logger.error(`get group(${groupId}) user(${userId}) name error`);
      logger.error(e);
      return null;
    }
  }

  /** NapCat/OneBot get_group_info，返回群名等 */
  async getGroupInfo(groupId: string | number): Promise<GetGroupInfo | null> {
    try {
      const meta = await axios.post<RequestResponse<Action.getGroupInfo>>(
        `${Config.QQ_SERVER}/get_group_info`,
        { group_id: groupId }
      );
      const data = meta.data?.data;
      return data ?? null;
    } catch (e) {
      logger.error(`get group(${groupId}) info error`);
      logger.error(e);
      return null;
    }
  }

  sendPrivateMessage(userId: string | number, message: MessageInput): void {
    const msg: OB11Segment[] =
      typeof message === 'string' ? [{ type: 'text', data: { text: message } }] : message;
    this._pushSent('private', String(userId), msg);
    axios.post(`${Config.QQ_SERVER}/send_private_msg`, { user_id: userId, message: msg });
  }

  sendPrivateMusic(userId: string | number, musicId: string | number): void {
    this.sendPrivateMessage(userId, [
      {
        type: 'music',
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
        type: 'image',
        data: { file: option.isBase64 ? `base64://${dataUrl}` : dataUrl }
      }
    ]);
  }

  sendGroupMessage(groupId: string | number, message: MessageInput): void {
    const msg: OB11Segment[] =
      typeof message === 'string' ? [{ type: 'text', data: { text: message } }] : message;
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
        type: 'image',
        data: { file: option.isBase64 ? `base64://${dataUrl}` : dataUrl }
      }
    ]);
  }

  sendGroupMusic(groupId: string | number, musicId: string | number): void {
    this.sendGroupMessage(groupId, [
      {
        type: 'music',
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
  convertMessageType(event: IncomingEvent): PluginPostType | undefined {
    if (!event || typeof event !== 'object') return;
    const postType = typeof event.post_type === 'string' ? event.post_type : undefined;
    if (postType === 'message' || postType === 'message_sent') {
      return typeof event.message_type === 'string'
        ? (event.message_type as PluginPostType)
        : (postType as PluginPostType);
    }
    return postType ?? undefined;
  }

  async sendReadyMessage(): Promise<void> {
    const message = `插件惰性载入完成于: ${formatShangHaiTime()}`;
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
