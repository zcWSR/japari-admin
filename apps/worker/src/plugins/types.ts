import type { IncomingEvent, PluginPostType } from '@/types/onebot';
import type { OB11Message } from '@/types/onebot11';

type IdLike = string | number;

export type PluginPostTypeLike = PluginPostType | 'message' | 'loader' | '';

export type PluginEvent = IncomingEvent;
export type CommandEvent = OB11Message;

export type CommandMap = Record<
  string,
  {
    trigger(
      params: string,
      body: CommandEvent,
      type: PluginPostTypeLike,
      commandMap: CommandMap
    ): Promise<unknown> | unknown;
  }
>;
