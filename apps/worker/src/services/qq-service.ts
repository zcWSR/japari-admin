import axios from 'axios';
import type { IncomingEvent, PluginPostType } from '@/types/onebot';
import {
  Action,
  type OB11Message,
  type OB11Segment,
  type Params,
  type Request
} from '@/types/onebot11';
import { isGroupMessage } from '@/utils/qq';
import Config from '../config';
import { formatShangHaiTime } from '../utils/date';
import { isDev } from '../utils/env';
import logger from '../utils/logger';
import { formatForLog, image, music, text } from '../utils/message';
import { sleep } from '../utils/process';

export type AllOB11RequestKeys = keyof Request;
export type AllOBRequestValues = Request[AllOB11RequestKeys];

export interface RequestResponse<T extends Action> {
  status: 'ok' | 'async' | 'failed';
  retcode: number;
  data: Request[T];
}

type AuthLevel = 'owner' | 'admin';

interface CapturedSentItem {
  type: string;
  id: number;
  message: OB11Segment[] | string;
}

class QQService {
  /** 模拟时收集本请求内通过 sendGroupMessage/sendPrivateMessage 发送的内容，供界面展示 */
  _captureSent: CapturedSentItem[] | null = null;

  constructor() {
    if (isDev()) {
      this.sendGroupMessage = (groupId: number, msg: OB11Segment[]) => {
        this._pushSent('group', groupId, msg);
        logger.debug(`===== send to group ${groupId}`);
        logger.debug(formatForLog(msg));
        logger.debug('===== done');
      };
      this.sendPrivateMessage = (userId: number, msg: OB11Segment[]) => {
        this._pushSent('private', userId, msg);
        logger.debug(`===== send to user ${userId}`);
        logger.debug(formatForLog(msg));
        logger.debug('===== done');
      };
    }
  }

  async request<K extends Action>(action: K, params: Params[K]): Promise<Request[K]> {
    const res = await axios.post<RequestResponse<K>>(`${Config.QQ_SERVER}/${action}`, params);
    if (res.data.status === 'failed') {
      throw new Error(`request ${action} failed: ${res.data.retcode}`);
    }
    return res.data.data;
  }

  _pushSent(type: string, id: number, message: OB11Segment[] | string): void {
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

  getGroupList() {
    return this.request(Action.getGroupList, {});
  }

  isSuperAdmin(userId: number) {
    return Config.ADMINS.includes(userId);
  }

  async getGroupMemberInfo(groupId: number, userId: number, noCache = false) {
    return this.request(Action.getGroupMemberInfo, {
      group_id: groupId,
      user_id: userId,
      no_cache: noCache
    });
  }

  async isGroupOwner(groupId: number, userId: number) {
    return (await this.getGroupMemberInfo(groupId, userId)).role === 'owner';
  }

  async isGroupAdminOrOwner(groupId: number, userId: number): Promise<boolean> {
    const role = (await this.getGroupMemberInfo(groupId, userId)).role;
    return role === 'admin' || role === 'owner';
  }

  getGroupInfo(groupId: number) {
    return this.request(Action.getGroupInfo, { group_id: groupId });
  }

  sendPrivateMessage(userId: number, message: OB11Segment[] | string): void {
    const msg: OB11Segment[] = Array.isArray(message) ? message : text(message);
    this._pushSent('private', userId, msg);
    this.request(Action.sendPrivateMsg, {
      user_id: userId,
      message: msg
    });
  }

  sendPrivateMusic(userId: number, musicId: string): void {
    this.sendPrivateMessage(userId, music(musicId));
  }

  sendPrivateImage(
    userId: number,
    dataUrl: string,
    option: { isBase64?: boolean } = { isBase64: false }
  ): void {
    this.sendPrivateMessage(userId, image(dataUrl, option.isBase64));
  }

  sendGroupMessage(groupId: number, message: OB11Segment[] | string): void {
    const msg: OB11Segment[] = Array.isArray(message)
      ? message
      : [{ type: 'text', data: { text: message } }];
    typeof message === 'string' ? [{ type: 'text', data: { text: message } }] : message;
    this._pushSent('group', groupId, msg);
    this.request(Action.sendGroupMsg, {
      group_id: groupId,
      message: msg
    });
  }

  sendGroupImage(
    groupId: number,
    dataUrl: string,
    option: { isBase64?: boolean } = { isBase64: false }
  ): void {
    this.sendGroupMessage(groupId, image(dataUrl, option.isBase64));
  }

  sendGroupMusic(groupId: number, musicId: string): void {
    this.sendGroupMessage(groupId, music(musicId));
  }

  sendMessage(incomingMessage: OB11Message, msg: OB11Segment[] | string): void {
    if (isGroupMessage(incomingMessage)) {
      this.sendGroupMessage(incomingMessage.group_id, msg);
    } else {
      this.sendPrivateMessage(incomingMessage.user_id, msg);
    }
  }

  sendMusic(incomingMessage: OB11Message, musicId: string): void {
    if (isGroupMessage(incomingMessage)) {
      this.sendGroupMusic(incomingMessage.group_id, musicId);
    } else {
      this.sendPrivateMusic(incomingMessage.user_id, musicId);
    }
  }

  sendImage(
    incomingMessage: OB11Message,
    dataUrl: string,
    option: { isBase64?: boolean } = { isBase64: false }
  ): void {
    if (isGroupMessage(incomingMessage)) {
      this.sendGroupImage(incomingMessage.group_id, dataUrl, option);
    } else {
      this.sendPrivateImage(incomingMessage.user_id, dataUrl, option);
    }
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

  async sendAdminsMessage(message: OB11Segment[] | string): Promise<void> {
    for (const admin of Config.ADMINS) {
      await this.sendPrivateMessage(admin, message);
      await sleep();
    }
  }

  authCheckFuncMap: Record<AuthLevel, (g: number, u: number) => Promise<boolean>> = {
    owner: this.isGroupOwner.bind(this),
    admin: this.isGroupAdminOrOwner.bind(this)
  };

  async checkRateWithMessage(
    rate: number,
    groupId: number,
    userId: number,
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
