import axios, { type AxiosRequestConfig } from 'axios';
import { deflateSync, unzlibSync } from 'fflate';
import * as OSU from 'ojsama';
import Config from '../config';
import logger from '../utils/logger';
import { numberToOsuModes } from '../utils/osu-utils';
import { objKeyToSmallCamel } from '../utils/string-utils';
import D1Service from './d1-service';
import QQService from './qq-service';

const GET_USER_URL = 'https://osu.ppy.sh/api/get_user';
const GET_BP_URL = 'https://osu.ppy.sh/api/get_user_best';
const GET_MAP_URL = 'https://osu.ppy.sh/api/get_beatmaps';
const GET_RECENT_URL = 'https://osu.ppy.sh/api/get_user_recent';
const GET_OSU_FILE_URL = 'https://osu.ppy.sh/osu';

const modeMap: Record<number, string> = {
  0: 'osu!',
  1: 'Taiko',
  2: 'CtB',
  3: 'osu!mania'
};

function base64ToUint8Array(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function uint8ArrayToBase64(arr: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]!);
  return btoa(bin);
}

export interface OsuBoundInfo {
  groupId?: string;
  userId?: string;
  osuId?: string;
  osuName?: string;
  mode?: number;
}

interface PlayInfo {
  beatmap_id: number;
  enabled_mods: number | string;
  maxcombo: number | string;
  countmiss: number | string;
  count50: number | string;
  count100: number | string;
  count300: number | string;
  score?: number | string;
  rank?: string;
  pp?: number | string;
  osu_name?: string;
}

interface MapInfo {
  beatmapset_id: number | string;
}

interface OsuMapLike {
  artist: string;
  title: string;
  title_unicode?: string;
  artist_unicode?: string;
  version: string;
  creator: string;
  ar: number;
  od: number;
  cs: number;
  hp: number;
  ncircles: number;
  nsliders: number;
  nspinners: number;
  max_combo(): number;
}

let serviceInstance: OSUService | null = null;

export default class OSUService {
  static getInstance(): OSUService {
    if (!serviceInstance) {
      serviceInstance = new OSUService();
    }
    return serviceInstance;
  }

  async getOsuBind(
    groupId: string | number,
    userId: string | number
  ): Promise<Record<string, unknown> | null> {
    const row = await D1Service.first('SELECT * FROM osu_bind WHERE group_id = ? AND user_id = ?', [
      groupId,
      userId
    ]);
    return row as Record<string, unknown> | null;
  }

  async setOsuBind(
    groupId: string | number,
    userId: string | number,
    osuId: string | number,
    osuName: string,
    mode: number
  ): Promise<{ results: unknown[] }> {
    return D1Service.query(
      `INSERT INTO osu_bind (group_id, user_id, osu_id, osu_name, mode) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, group_id) DO UPDATE SET osu_id = excluded.osu_id, osu_name = excluded.osu_name, mode = excluded.mode`,
      [groupId, userId, osuId, osuName, mode]
    );
  }

  async deleteOsuBind(
    groupId: string | number,
    userId: string | number
  ): Promise<{ results: unknown[] }> {
    return D1Service.query('DELETE FROM osu_bind WHERE group_id = ? AND user_id = ?', [
      groupId,
      userId
    ]);
  }

  async getOsuMap(mapId: string | number): Promise<string | null> {
    const row = await D1Service.first('SELECT map FROM osu_map WHERE id = ?', [mapId]);
    const r = row as { map?: string } | null;
    return r?.map ?? null;
  }

  async setOsuMap(mapId: string | number, mapData: string): Promise<{ results: unknown[] }> {
    return D1Service.query('INSERT OR REPLACE INTO osu_map (id, map) VALUES (?, ?)', [
      mapId,
      mapData
    ]);
  }

  async fetch<T = unknown>(
    url: string,
    params: Record<string, unknown> | null,
    config?: AxiosRequestConfig
  ): Promise<T | null> {
    let retryTimes = 0;
    let meta: { data?: T };
    while (retryTimes < 3) {
      try {
        meta = await axios({
          url,
          params: { k: Config.OSU_APP_KEY, ...params },
          timeout: 3 ** (retryTimes + 1) * 1000,
          ...config
        });
        retryTimes = 10;
      } catch (e) {
        retryTimes += 1;
        logger.error(`请求: ${url} 发生错误:`);
        logger.error(String(e));
        logger.error(`正在进行第${retryTimes}次重试`);
      }
    }
    if (retryTimes === 3) {
      logger.error(`请求: ${url} 失败`);
      return null;
    }
    return meta!.data ?? null;
  }

  async getBoundInfo(
    groupId: string | number,
    userId: string | number
  ): Promise<OsuBoundInfo | null> {
    const meta = await this.getOsuBind(groupId, userId);
    if (meta) return objKeyToSmallCamel(meta as Record<string, unknown>) as OsuBoundInfo;
    return null;
  }

  async getUserByName(osuName: string, mode = 0): Promise<Record<string, unknown> | string> {
    const users = await this.fetch<Record<string, unknown>[]>(GET_USER_URL, {
      u: osuName,
      type: 'string',
      mode
    });
    if (!users?.length) {
      const message = `获取玩家'${osuName}'的信息失败, ${!users ? '请求出错' : '用户不存在'}`;
      logger.warn(message);
      return message;
    }
    return users[0]!;
  }

  async bindOSUId(
    groupId: string | number,
    userId: string | number,
    osuName: string,
    mode = 0
  ): Promise<string> {
    const user = await this.getUserByName(osuName, mode);
    if (typeof user === 'string') return user;
    const isBind = await this.getBoundInfo(groupId, userId);
    await this.setOsuBind(
      groupId,
      userId,
      (user as { user_id?: string }).user_id ?? '',
      osuName,
      mode
    );
    const message = isBind
      ? `更新账号绑定为'${osuName}', 模式: ${modeMap[mode] ?? mode}`
      : `账号'${osuName}'绑定成功, 模式: ${modeMap[mode] ?? mode}`;
    logger.info(`qq${userId}${message}`);
    return message;
  }

  async unBindOSUId(groupId: string | number, userId: string | number): Promise<string> {
    const isBind = await this.getBoundInfo(groupId, userId);
    if (!isBind) {
      const message = '未绑定任何账号, 无法解除绑定';
      logger.warn(`qq${userId}${message}`);
      return message;
    }
    await this.deleteOsuBind(groupId, userId);
    return '解绑成功';
  }

  async getBP(
    userInfo: OsuBoundInfo,
    index: number
  ): Promise<string | { playInfo: PlayInfo; mapInfo: Record<string, unknown> }> {
    const idx = index || 1;
    const playInfos = await this.fetch<PlayInfo[]>(GET_BP_URL, {
      u: userInfo.osuId,
      m: userInfo.mode,
      type: 'id',
      limit: idx
    });
    if (!playInfos?.length) {
      const message = `获取${userInfo.osuName}的bp#${idx}失败, ${
        !playInfos ? '请求出错' : '不存在bp数据'
      }, 请重试`;
      logger.warn(message);
      return message;
    }
    const playInfo = playInfos.slice().reverse()[0]!;
    const mapsInfo = await this.fetch<Record<string, unknown>[]>(GET_MAP_URL, {
      b: playInfo.beatmap_id
    });
    if (!mapsInfo?.length) {
      const message = `信息失败, ${!mapsInfo ? '请求出错' : 'beatmap不存在'}, 请重试`;
      logger.warn(`获取beatmap${playInfo.beatmap_id}${message}`);
      return `获取beatmap${message}`;
    }
    const mapInfo = mapsInfo[0]!;
    return { playInfo: { osu_name: userInfo.osuName, ...playInfo }, mapInfo };
  }

  async getRecent(
    userInfo: OsuBoundInfo,
    index: number
  ): Promise<string | { playInfo: PlayInfo; mapInfo: Record<string, unknown> }> {
    const idx = index || 1;
    const playInfos = await this.fetch<PlayInfo[]>(GET_RECENT_URL, {
      u: userInfo.osuId,
      m: userInfo.mode,
      type: 'id',
      limit: idx
    });
    if (!playInfos?.length) {
      const message = `获取${userInfo.osuName}的recent#${idx}失败, ${
        !playInfos ? '请求出错' : '不存在recent数据'
      }, 请重试`;
      logger.warn(message);
      return message;
    }
    const playInfo = playInfos.slice().reverse()[0]!;
    const mapsInfo = await this.fetch<Record<string, unknown>[]>(GET_MAP_URL, {
      b: playInfo.beatmap_id
    });
    if (!mapsInfo?.length) {
      const message = `信息失败, ${!mapsInfo ? '请求出错' : 'beatmap不存在'}, 请重试`;
      logger.warn(`获取beatmap${playInfo.beatmap_id}${message}`);
      return `获取beatmap${message}`;
    }
    const mapInfo = mapsInfo[0]!;
    return { playInfo: { osu_name: userInfo.osuName, ...playInfo }, mapInfo };
  }

  async getMap(mapId: string | number): Promise<string | null> {
    const mapData = await this.getOsuMap(mapId);
    if (mapData) {
      return new TextDecoder().decode(unzlibSync(base64ToUint8Array(mapData)));
    }
    const map = await this.fetch<string>(`${GET_OSU_FILE_URL}/${mapId}`, null, {
      responseType: 'text'
    });
    if (!map) return null;
    const mapZip = uint8ArrayToBase64(deflateSync(new TextEncoder().encode(map)));
    await this.setOsuMap(mapId, mapZip);
    return map;
  }

  async getPP(info: {
    playInfo: PlayInfo;
    mapInfo: MapInfo;
  }): Promise<string | { acc: number; pp: string; map: OsuMapLike } | { map: OsuMapLike }> {
    const {
      playInfo: {
        beatmap_id: beatMapId,
        enabled_mods: enabledMods,
        maxcombo,
        countmiss,
        count50,
        count100,
        count300
      }
    } = info;
    const mapString = await this.getMap(beatMapId);
    if (!mapString) {
      const message = '铺面信息失败';
      logger.warn(`获取${beatMapId}${message}, 无法计算pp`);
      return `获取${message}, 请重试`;
    }
    const parser = new OSU.parser();
    parser.feed(mapString);
    const { map } = parser;
    type PPResult = {
      computed_accuracy?: { value: () => number };
      total: { toFixed: (n: number) => string };
    };
    let pp: PPResult | null = null;
    try {
      const stars = new OSU.diff().calc({
        map,
        mods: +enabledMods
      });
      pp = OSU.ppv2({
        stars,
        combo: +maxcombo,
        nmiss: +countmiss,
        n50: +count50,
        n100: +count100,
        n300: +count300
      }) as unknown as PPResult;
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string };
      if (err.name === 'NotImplementedError') {
        return { map: map as OsuMapLike };
      }
      (err as { message: string }).message = '未知错误';
      throw e;
    }

    return {
      acc: pp.computed_accuracy?.value() ?? 0,
      pp: pp.total.toFixed(2),
      map: map as OsuMapLike
    };
  }

  async sendInfo(
    prefix: string,
    info: { playInfo: PlayInfo; mapInfo: MapInfo },
    groupId: string | number
  ): Promise<void> {
    const ppInfo = await this.getPP(info);
    if (typeof ppInfo === 'string') {
      QQService.sendGroupMessage(groupId, ppInfo);
      return;
    }
    const {
      playInfo: {
        osu_name: osuName,
        maxcombo,
        count50,
        count100,
        count300,
        countmiss,
        score,
        rank,
        enabled_mods: enabledMods
      },
      mapInfo: { beatmapset_id: beatmapsetId }
    } = info;
    const acc = 'acc' in ppInfo ? ppInfo.acc : 0;
    const pp = 'pp' in ppInfo ? ppInfo.pp : undefined;
    const map = ppInfo.map;
    let message = `玩家${osuName}的${prefix}\n--------\n`;
    message += `${map.artist} - ${map.title}`;
    if (map.title_unicode || map.artist_unicode) {
      message += `(${map.artist_unicode} - ${map.title_unicode})`;
    }
    message += `[${map.version}] mapped by ${map.creator}\n`;
    message += `Url: https://osu.ppy.sh/beatmapsets/${beatmapsetId}\n\n`;
    message += `AR${Number.parseFloat(map.ar.toFixed(2))} OD${Number.parseFloat(
      map.od.toFixed(2)
    )} CS${Number.parseFloat(map.cs.toFixed(2))} HP${Number.parseFloat(map.hp.toFixed(2))}\n`;
    message += `${map.ncircles} circles, ${map.nsliders} sliders, ${map.nspinners} spinners\n\n`;
    message += `Score: ${score}\n`;
    message += `Rank: ${rank}\n`;
    message += `Mod: ${numberToOsuModes(Number(enabledMods)).join(' ')}\n`;
    message += acc ? `Acc: ${(acc * 100).toFixed(2)}%\n` : 'Acc: N/A\n';
    message += `Max Combo: ${maxcombo}/${map.max_combo()}\n`;
    message += `${count300}x300, ${count100}x100, ${count50}x50, ${countmiss}xmiss\n`;
    if (info.playInfo.pp) {
      message += `${Number.parseFloat(String(info.playInfo.pp)).toFixed(2)} pp (官方)\n`;
    }
    if (pp) {
      message += `${pp} pp (离线计算)`;
    }
    logger.info(`格式化玩家'${osuName}'的${prefix}数据成功`);
    logger.info(`地图id: ${beatmapsetId}, 难度[${map.version}], ${pp} pp`);
    QQService.sendGroupMessage(groupId, message);
  }
}
