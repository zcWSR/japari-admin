/**
 * 插件与事件适配类型（基于 OneBot 11，与 convertMessageType / 插件链一致）
 */

import type { OB11GroupMessage, OB11Message, OB11PrivateMessage } from '@/types/onebot11';

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

export abstract class PluginBase {
  declare name: string;
  declare weight: number;
  declare type: PluginKind;
  declare shortInfo: string;
  declare info: string;
  declare default: boolean;
  declare hide: boolean;
  declare mute: boolean;
  abstract go(body: IncomingEvent): void | 'break' | Promise<void | 'break'>;
  init(): Promise<void> {
    return Promise.resolve();
  }
}

export abstract class GroupPluginBase extends PluginBase {
  declare type: 'group';
  abstract go(body: OB11GroupMessage): void | 'break' | Promise<void | 'break'>;
}

export abstract class PrivatePluginBase extends PluginBase {
  declare type: 'private';
  abstract go(body: OB11PrivateMessage): void | 'break' | Promise<void | 'break'>;
}

export abstract class NoticePluginBase extends PluginBase {
  declare type: 'notice';
  abstract go(body: OB11NoticeEvent): void | 'break' | Promise<void | 'break'>;
}

export abstract class LoaderPluginBase extends PluginBase {
  declare type: 'loader';
  abstract go(): void | Promise<void>;
}

export abstract class CommandBase {
  declare name: string;
  declare command: string | string[];
  declare type: CommandKind;
  declare info: string;
  declare mute: boolean;
  declare level: number;
  declare default: boolean;
  declare hide: boolean;
  declare permissionDeniedNotice: string;
  init(): Promise<void> {
    return Promise.resolve();
  }
  trigger(params: string, body: OB11Message, commandMap: unknown): Promise<unknown> | unknown {
    return this.run(params, body, commandMap);
  }
  abstract run(params: string, body: OB11Message, commandMap: unknown): Promise<unknown> | unknown;
}

export abstract class GroupCommandBase extends CommandBase {
  declare type: 'group';
  abstract run(
    params: string,
    body: OB11GroupMessage,
    commandMap: unknown
  ): Promise<unknown> | unknown;
}

export abstract class PrivateCommandBase extends CommandBase {
  declare type: 'private';
  abstract run(
    params: string,
    body: OB11PrivateMessage,
    commandMap: unknown
  ): Promise<unknown> | unknown;
}

export abstract class GroupCommandMap extends CommandBase {
  declare type: 'group';
  abstract run(
    params: string,
    body: OB11GroupMessage,
    commandMap: unknown
  ): Promise<unknown> | unknown;
}

export type CommandMap = Record<string, CommandBase>;
