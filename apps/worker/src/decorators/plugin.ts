import QQService from '@/services/qq-service';
import type { OB11Message } from '@/types/onebot11';
import { isGroupMessage } from '@/utils/qq';
import logger from '../utils/logger';
import type { CommandBase, CommandMap, IncomingEvent, PluginBase, PluginPostType } from './types';

type PluginClass<TInstance extends PluginBase = PluginBase> = new (...args: any[]) => TInstance;
type CommandClass<TInstance extends CommandBase = CommandBase> = new (...args: any[]) => TInstance;
type PluginDecoratorResult<TBase extends PluginClass> = new (
  ...args: ConstructorParameters<TBase>
) => InstanceType<TBase> & PluginConfig;

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

export function Plugin(config: string | PluginConfig) {
  const merged: PluginConfig =
    typeof config === 'string'
      ? { ...defaultPluginConfig, name: config }
      : { ...defaultPluginConfig, ...config };

  return <TBase extends PluginClass>(target: TBase): PluginDecoratorResult<TBase> => {
    class PluginWrapped extends target {
      declare name: string;
      declare mute: boolean;

      constructor(...args: any[]) {
        super(...args);
        for (const key of Object.keys(merged) as (keyof PluginConfig)[]) {
          (this as Record<string, unknown>)[key] = merged[key];
        }
      }

      go(body: IncomingEvent, type?: PluginPostType): Promise<void | 'break'> {
        if (!this.mute) logger.info(`plugin ${this.name} triggered`);
        const proto = target.prototype;
        return Promise.resolve(proto.go?.call(this, body, type));
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
  command: string | string[];
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

type CommandDecoratorResult<TBase extends CommandClass> = new (
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

  return <TBase extends CommandClass>(target: TBase): CommandDecoratorResult<TBase> => {
    class CommandWrapped extends target {
      declare command: string | string[];
      declare mute: boolean;
      declare level: number;
      declare permissionDeniedNotice: string;

      constructor(...args: any[]) {
        super(...args);
        for (const key of Object.keys(merged) as (keyof CommandConfig)[]) {
          (this as Record<string, unknown>)[key] = merged[key];
        }
      }

      sendNoPermissionMsg(ctx: OB11Message, _type?: PluginPostType) {
        QQService.sendMessage(ctx, this.permissionDeniedNotice ?? '权限不足');
      }

      run(params: string, body: OB11Message, commandMap: unknown) {
        const proto = target.prototype as CommandBase;
        return proto.run.call(this, params, body, commandMap);
      }

      async trigger(params: string, body: OB11Message, commandMap: CommandMap) {
        if (!this.mute) logger.info(`command '!${this.command}' triggered, params: ${params}`);
        if (this.level === 3) {
          if (!QQService.isSuperAdmin(body.user_id)) {
            this.sendNoPermissionMsg(body);
            return;
          }
        } else if (this.level === 2) {
          if (!isGroupMessage(body)) return;
          const role = body.sender.role;
          if (role !== 'owner' && role !== 'admin') {
            QQService.sendGroupMessage(body.group_id, this.permissionDeniedNotice ?? '权限不足');
            return;
          }
        }
        this.run(params, body, commandMap);
      }
    }

    return CommandWrapped as unknown as CommandDecoratorResult<TBase>;
  };
}
