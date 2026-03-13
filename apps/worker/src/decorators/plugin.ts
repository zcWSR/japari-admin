import type { CommandMap } from '@/plugins/types';
import QQService from '@/services/qq-service';
import type { IncomingEvent, PluginPostType } from '@/types/onebot';
import logger from '../utils/logger';

type Class<TInstance extends object = object> = new (...args: any[]) => TInstance;

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

type PluginDecoratorResult<TBase extends Class> = new (
  ...args: ConstructorParameters<TBase>
) => InstanceType<TBase> &
  PluginConfig & {
    go(body: IncomingEvent, type: PluginPostType): Promise<undefined | 'break'>;
  };

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
  const merged: PluginConfig =
    typeof config === 'string'
      ? { ...defaultPluginConfig, name: config }
      : { ...defaultPluginConfig, ...config };

  return <TBase extends Class>(target: TBase): PluginDecoratorResult<TBase> => {
    class PluginWrapped extends target {
      declare name: string;
      declare mute: boolean;

      constructor(...args: any[]) {
        super(...args);
        for (const key of Object.keys(merged) as (keyof PluginConfig)[]) {
          (this as Record<string, unknown>)[key] = merged[key];
        }
      }

      go(body: IncomingEvent, type: PluginPostType): Promise<undefined | 'break'> {
        if (!this.mute) logger.info(`plugin ${this.name} triggered`);
        const proto = target.prototype as {
          go?: (body: IncomingEvent, type: PluginPostType) => Promise<undefined | 'break'>;
        };
        return proto.go?.call(this, body, type) ?? Promise.resolve(undefined);
      }
    }

    return PluginWrapped as unknown as PluginDecoratorResult<TBase>;
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
  default?: boolean;
  hide?: boolean;
  permissionDeniedNotice?: string;
}

type CommandRuntime = {
  sendNoPermissionMsg(
    ctx: { group_id?: string | number; user_id?: string | number },
    type: PluginPostType
  ): void;
  trigger(
    params: string,
    body: IncomingEvent,
    type: PluginPostType,
    commandMap: CommandMap
  ): Promise<unknown>;
};

type CommandDecoratorResult<TBase extends Class> = new (
  ...args: ConstructorParameters<TBase>
) => InstanceType<TBase> & CommandConfig & CommandRuntime;

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
  let merged: CommandConfig =
    typeof config === 'string'
      ? { ...defaultCommandConfig, name: config, command: config }
      : { ...defaultCommandConfig, ...config };
  if (merged.type === 'private' && (merged.level ?? 0) < 3) {
    merged = { ...merged, level: 1 };
  }

  return <TBase extends Class>(target: TBase): CommandDecoratorResult<TBase> => {
    class CommandWrapped extends target {
      declare command: string;
      declare mute: boolean;
      declare level: number;
      declare permissionDeniedNotice: string;

      constructor(...args: any[]) {
        super(...args);
        for (const key of Object.keys(merged) as (keyof CommandConfig)[]) {
          (this as Record<string, unknown>)[key] = merged[key];
        }
      }

      sendNoPermissionMsg(
        ctx: { group_id?: string | number; user_id?: string | number },
        type: PluginPostType
      ): void {
        if (type === 'group' && ctx.group_id != null) {
          QQService.sendGroupMessage(ctx.group_id, this.permissionDeniedNotice ?? '权限不足');
          return;
        }
        if (type === 'private' && ctx.user_id != null) {
          QQService.sendPrivateMessage(ctx.user_id, this.permissionDeniedNotice ?? '权限不足');
        }
      }

      async trigger(
        params: string,
        body: IncomingEvent,
        type: PluginPostType,
        commandMap: CommandMap
      ): Promise<unknown> {
        if (!this.mute) logger.info(`command '!${this.command}' triggered, params: ${params}`);
        if (this.level === 3) {
          const uid = (body as { user_id?: string | number }).user_id;
          if (uid == null || !QQService.isSuperAdmin(uid)) {
            this.sendNoPermissionMsg(body as { group_id?: string | number; user_id?: string | number }, type);
            return;
          }
        } else if (this.level === 2) {
          const b = body as { group_id?: string | number; user_id?: string | number };
          if (b.group_id == null || b.user_id == null) return;
          const userRole = await QQService.getGroupUserRole(b.group_id, b.user_id);
          if (userRole !== 'owner' && userRole !== 'admin') {
            QQService.sendGroupMessage(b.group_id, this.permissionDeniedNotice ?? '权限不足');
            return;
          }
        }
        const proto = target.prototype as {
          run?: (
            params: string,
            body: IncomingEvent,
            type: PluginPostType,
            commandMap: CommandMap
          ) => Promise<unknown> | unknown;
        };
        return proto.run?.call(this, params, body, type, commandMap);
      }
    }

    return CommandWrapped as unknown as CommandDecoratorResult<TBase>;
  };
}
