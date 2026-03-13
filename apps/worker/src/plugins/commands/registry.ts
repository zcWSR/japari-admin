import adminMessageDebug from './admin-message-debug';
import garbageWordRandom from './garbage-word-ramdom';
import genshinCharacterArtifacts from './genshin-character-artifacts';
import help from './help';
import homo from './homo';
import hoshii from './hoshii';
import hso from './hso';
import masterSend from './master-send';
import newMemberNotice from './new-member-notice';
import osuBind from './osu-bind';
import osuBp from './osu-bp';
import osuBpme from './osu-bpme';
import osuRecent from './osu-recent';
import osuUnbind from './osu-unbind';
import plugin from './plugin';
import pr from './pr';
import readAgainRandom from './read-again-random';
import roll from './roll';
import schedule from './schedule';
import scheduleTime from './schedule-time';
import setting from './setting';
import type { CommandEvent, CommandMap, PluginEvent, PluginPostTypeLike } from '../types';

export const commands = [
  help,
  schedule,
  scheduleTime,
  plugin,
  setting,
  roll,
  hoshii,
  homo,
  osuBind,
  osuUnbind,
  osuRecent,
  osuBp,
  osuBpme,
  genshinCharacterArtifacts,
  pr,
  masterSend,
  hso,
  newMemberNotice,
  garbageWordRandom,
  readAgainRandom,
  adminMessageDebug
];
