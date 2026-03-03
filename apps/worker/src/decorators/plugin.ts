import type { IncomingEvent, IPlugin, PluginPostType } from '@/types/onebot';
import QQService from '@/services/qq-service';
import logger from '../utils/logger';

/** @Plugin 的配置参数 */
export interface PluginConfig {
  name: string;
  weight?: number;
  type?: 'group' | 'private' | 'message' | 'notice' | 'loader';
  shortInfo?: string;
  info?: string;
  default?: boolean;
  hide?: boolean;
  mute?: boolean;
}

const defaultPluginConfig: PluginConfig = {
  name: '',
  weight: 0,
  type: 'group',
  shortInfo: '',
  info: '',
  default: false,
  hide: false,
  mute: false
};

export function Plugin(config: string | Partial<PluginConfig>) {
  let merged: PluginConfig;
  if (typeof config === 'string') {
    merged = { ...defaultPluginConfig, name: config };
  } else {
    merged = { ...defaultPluginConfig, ...config };
  }
  return <T extends new (...args: any[]) => IPlugin>(target: T) =>
    class extends target {
      constructor(...args: any[]) {
        super(...args);
        for (const key of Object.keys(merged) as (keyof PluginConfig)[]) {
          (this as Record<string, unknown>)[key] = merged[key];
        }
      }

      go(body: IncomingEvent, type: PluginPostType): Promise<undefined | 'break'> {
        if (!this.mute) logger.info(`plugin ${this.name} triggered`);
        const proto = target.prototype as { go?: (body: IncomingEvent, type: PluginPostType) => Promise<undefined | 'break'> };
        return proto.go?.call(this, body, type) ?? Promise.resolve(undefined);
      }
    };
}

/** 权限级别 */
export const LEVEL = {
  NORMAL: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3
} as const;

/** @Command 的配置参数 */
export interface CommandConfig {
  name: string;
  command: string;
  type?: 'all' | 'group' | 'private';
  info?: string;
  mute?: boolean;
  level?: number;
  permissionDeniedNotice?: string;
}

const defaultCommandConfig: CommandConfig = {
  name: '',
  command: '',
  type: 'all',
  info: '描述',
  mute: false,
  level: 1,
  permissionDeniedNotice: '权限不足'
};

export function Command(config: string | Partial<CommandConfig>) {
  let merged: CommandConfig;
  if (typeof config === 'string') {
    merged = { ...defaultCommandConfig, name: config, command: config };
  } else {
    merged = { ...defaultCommandConfig, ...config };
  }
  if (merged.type === 'private' && (merged.level ?? 0) < 3) {
    merged = { ...merged, level: 1 };
  }
  return <T extends new (...args: any[]) => object>(target: T) =>
    class extends target {
      constructor(...args: any[]) {
        super(...args);
        for (const key of Object.keys(merged) as (keyof CommandConfig)[]) {
          (this as Record<string, unknown>)[key] = merged[key];
        }
      }

      sendNoPermissionMsg(
        ctx: { group_id?: string; user_id?: string },
        type: PluginPostType
      ): void {
        const cfg = this as unknown as CommandConfig;
        if (type === 'group' && ctx.group_id != null) {
          QQService.sendGroupMessage(ctx.group_id, cfg.permissionDeniedNotice ?? '权限不足');
          return;
        }
        if (type === 'private' && ctx.user_id != null) {
          QQService.sendPrivateMessage(ctx.user_id, cfg.permissionDeniedNotice ?? '权限不足');
        }
      }

      async trigger(
        params: string,
        body: IncomingEvent,
        type: PluginPostType,
        commandMap: unknown
      ): Promise<unknown> {
        const cfg = this as unknown as CommandConfig;
        if (!cfg.mute) logger.info(`command '!${cfg.command}' triggered, params: ${params}`);
        if (cfg.level === 3) {
          const uid = (body as { user_id?: string }).user_id;
          if (uid == null || !QQService.isSuperAdmin(uid)) {
            this.sendNoPermissionMsg(body as { group_id?: string; user_id?: string }, type);
            return;
          }
        } else if (cfg.level === 2) {
          const b = body as { group_id?: string; user_id?: string };
          const userRole = await QQService.getGroupUserRole(b.group_id!, b.user_id!);
          if (userRole !== 'owner' && userRole !== 'admin') {
            QQService.sendGroupMessage(b.group_id!, cfg.permissionDeniedNotice ?? '权限不足');
            return;
          }
        }
        const proto = target.prototype as { run?: (params: string, body: IncomingEvent, type: PluginPostType, commandMap: unknown) => Promise<unknown> };
        return proto.run?.call(this, params, body, type, commandMap);
      }
    };
}
