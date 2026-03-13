import netEastMusic from './163-music';
import checkMessageDebug from './checkMessageDebug';
import commandRunner from './command-runner';
import garbageWordRandom from './garbage-word-random';
import newNotice from './new-notice';
import readAgainFollow from './read-again-follow';
import readAgainRandom from './read-again-random';
import selfIgnore from './self-ignore';
import type { CommandEvent, CommandMap, PluginEvent, PluginPostTypeLike } from './types';

export const plugins = [
  commandRunner,
  netEastMusic,
  newNotice,
  garbageWordRandom,
  readAgainFollow,
  readAgainRandom,
  checkMessageDebug,
  selfIgnore
];
