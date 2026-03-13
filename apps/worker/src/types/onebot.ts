/**
 * 插件与事件适配类型（基于 OneBot 11，与 convertMessageType / 插件链一致）
 */

import type { OB11Message } from '@/types/onebot11';

/** 通知类上报事件（post_type === 'notice'） */
export interface OB11NoticeEvent {
  post_type: 'notice';
  notice_type: string; // e.g. 'group_increase'
  user_id?: string | number;
  group_id?: string | number;
  operator_id?: string | number;
  [k: string]: unknown;
}

/** 插件链入参：消息事件（OB11Message）或通知事件 */
export type IncomingEvent = OB11Message | OB11NoticeEvent;

/** 插件运行态类型，即 QQService.convertMessageType 的返回值 */
export type PluginPostType = 'group' | 'private' | 'notice';
export type PluginKind = 'group' | 'private' | 'message' | 'notice' | 'loader';
export type CommandKind = 'all' | 'group' | 'private';

/** 插件实例接口（供 decorator / PluginService 类型标注） */
export interface IPlugin {
  name: string;
  weight?: number;
  type: PluginKind;
  shortInfo: string;
  info: string;
  default: boolean;
  hide: boolean;
  mute: boolean;
  go(body: IncomingEvent, type: PluginPostType): Promise<undefined | 'break'>;
  init(): Promise<void>;
}

export interface ICommand {
  name: string;
  command: string;
  type: CommandKind;
  info: string;
  mute: boolean;
  level: number;
  default: boolean;
  hide: boolean;
  permissionDeniedNotice: string;
  init(): Promise<void>;
  run(
    params: string,
    body: IncomingEvent,
    type: PluginPostType,
    commandMap: unknown
  ): Promise<unknown> | unknown;
}
