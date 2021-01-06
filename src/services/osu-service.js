import { deflateSync, unzipSync } from 'zlib';
import axios from 'axios';

import * as OSU from 'ojsama';
import QQService from './qq-service';
import Config from '../config';
import logger from '../utils/logger';
import { numberToOsuModes } from '../utils/osu-utils';
import { objKeyToSmallCamel } from '../utils/string-utils';

const GET_USER_URL = 'https://osu.ppy.sh/api/get_user';
const GET_BP_URL = 'https://osu.ppy.sh/api/get_user_best';
const GET_MAP_URL = 'https://osu.ppy.sh/api/get_beatmaps';
const GET_RECENT_URL = 'https://osu.ppy.sh/api/get_user_recent';
// const GET_SCORE_URL = 'https://osu.ppy.sh/api/get_scores';
// const GET_MATCH_URL = 'https://osu.ppy.sh/api/get_match';
const GET_OSU_FILE_UTL = 'https://osu.ppy.sh/osu';

const modeMap = {
  0: 'osu!',
  1: 'Taiko',
  2: 'CtB',
  3: 'osu!mania'
};

let dbInstance = null;
let serviceInstance = null;

export default class OSUService {
  instance = null;
  static setDBInstance(instance) {
    dbInstance = instance;
  }

  /**
   * 获取实例
   * @return {OSUService} 实例
   */
  static getInstance() {
    if (!serviceInstance) {
      serviceInstance = new OSUService();
    }
    return serviceInstance;
  }

  async fetch(url, params, config) {
    let retryTimes = 0;
    let meta;
    while (retryTimes < 3) {
      try {
        meta = await axios({
          url,
          params: Object.assign(
            {
              k: Config.OSU_APP_KEY
            },
            params
          ),
          timeout: (3 ** (retryTimes + 1)) * 1000,
          ...config
        });
        retryTimes = 10;
      } catch (e) {
        retryTimes += 1;
        logger.error(`请求: ${url} 发生错误:`);
        logger.error(e.toString());
        logger.error(`正在进行第${retryTimes}次重试`);
      }
    }
    if (retryTimes === 3) {
      logger.error(`请求: ${url} 失败`);
      return null;
    }
    return meta.data || null;
  }

  async getBoundInfo(groupId, userId) {
    const meta = await dbInstance('osu_bind')
      .where({ group_id: groupId, user_id: userId })
      .first();
    if (meta) {
      return objKeyToSmallCamel(meta, '_');
    }
    return meta;
  }

  async getUserByName(osuName, mode = 0) {
    const users = await this.fetch(GET_USER_URL, {
      u: osuName,
      type: 'string',
      mode
    });
    if (!users || !users.length) {
      const message = `获取玩家'${osuName}'的信息失败, ${!users ? '请求出错' : '用户不存在'}`;
      logger.warn(message);
      return message;
    }
    return users[0];
  }

  async bindOSUId(groupId, userId, osuName, mode = 0) {
    const isBind = await this.getBoundInfo(groupId, userId);
    const user = await this.getUserByName(osuName, mode);
    if (typeof user === 'string') {
      return user;
    }
    let message;
    if (isBind) {
      await dbInstance('osu_bind')
        .update({
          osu_id: user.user_id,
          osu_name: osuName,
          mode
        })
        .where({ user_id: userId, group_id: groupId });
      message = `更新账号绑定为'${osuName}', 模式: ${modeMap[mode]}`;
    } else {
      await dbInstance('osu_bind').insert({
        user_id: userId,
        group_id: groupId,
        osu_id: user.user_id,
        osu_name: osuName,
        mode
      });
      message = `账号'${osuName}'绑定成功, 模式: ${modeMap[mode]}`;
    }
    logger.info(`qq${userId}${message}`);
    return message;
  }

  async unBindOSUId(groupId, userId) {
    const isBind = await this.getBoundInfo(groupId, userId);
    if (!isBind) {
      const message = '未绑定任何账号, 无法解除绑定';
      logger.warn(`qq${userId}${message}`);
      return message;
    }
    await dbInstance('osu_bind')
      .where({ group_id: groupId, user_id: userId })
      .del();
    return '解绑成功';
  }

  async getBP(userInfo, index) {
    // console.log(JSON.stringify(userInfo, null, 2));
    index = index || 1;
    const playInfos = await this.fetch(GET_BP_URL, {
      u: userInfo.osuId,
      m: userInfo.mode,
      type: 'id',
      limit: index
    });
    if (!playInfos || !playInfos.length) {
      const message = `获取${userInfo.osuName}的bp#${index}失败, ${
        !playInfos ? '请求出错' : '不存在bp数据'
      }, 请重试`;
      logger.warn(message);
      return message;
    }
    const playInfo = playInfos.reverse()[0];
    const mapsInfo = await this.fetch(GET_MAP_URL, {
      b: playInfo.beatmap_id
    });
    if (!mapsInfo || !mapsInfo.length) {
      const message = `信息失败, ${!mapsInfo ? '请求出错' : 'beatmap不存在'}, 请重试`;
      logger.warn(`获取beatmap${playInfo.beatmap_id}${message}`);
      return `获取beatmap${message}`;
    }
    const mapInfo = mapsInfo[0];
    return { playInfo: { osu_name: userInfo.osuName, ...playInfo }, mapInfo };
  }

  async getRecent(userInfo, index) {
    index = index || 1;
    const playInfos = await this.fetch(GET_RECENT_URL, {
      u: userInfo.osuId,
      m: userInfo.mode,
      type: 'id',
      limit: index || 1
    });
    if (!playInfos || !playInfos.length) {
      const message = `获取${userInfo.osuName}的recent#${index}失败, ${
        !playInfos ? '请求出错' : '不存在recent数据'
      }, 请重试`;
      logger.warn(message);
      return message;
    }
    const playInfo = playInfos.reverse()[0];
    const mapsInfo = await this.fetch(GET_MAP_URL, {
      b: playInfo.beatmap_id
    });
    if (!mapsInfo || !mapsInfo.length) {
      const message = `信息失败, ${!mapsInfo ? '请求出错' : 'beatmap不存在'}, 请重试`;
      logger.warn(`获取beatmap${playInfo.beatmap_id}${message}`);
      return `获取beatmap${message}`;
    }
    const mapInfo = mapsInfo[0];
    return { playInfo: { osu_name: userInfo.osuName, ...playInfo }, mapInfo };
  }

  async getMap(mapId) {
    const meta = await dbInstance('osu_map')
      .where('id', mapId)
      .first();
    if (meta) {
      return unzipSync(Buffer.from(meta.map, 'base64')).toString();
    }
    const map = await this.fetch(`${GET_OSU_FILE_UTL}/${mapId}`, null, { responseType: 'text' });
    if (!map) {
      return null;
    }
    const mapZip = deflateSync(map).toString('base64');
    await dbInstance('osu_map').insert({ id: mapId, map: mapZip });
    return map;
  }

  async getPP(info) {
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
      // mapInfo
    } = info;
    const mapString = await this.getMap(beatMapId);
    if (!mapString) {
      const message = '铺面信息失败';
      logger.warn(`获取${beatMapId}${message}, 无法计算pp`);
      return `获取${message}, 请重试`;
    }
    // eslint-disable-next-line
    const parser = new OSU.parser();
    parser.feed(mapString);
    const { map } = parser;
    // eslint-disable-next-line new-cap

    try { //FIXED : NotImplementedError when calculate diff or pp for unsupported game modes
        const stars = new OSU.diff().calc({
            map,
            mods: +enabledMods
        });
        const pp = OSU.ppv2({
            stars,
            combo: +maxcombo,
            nmiss: +countmiss,
            n50: +count50,
            n100: +count100,
            n300: +count300
        });
    } catch (e) {
        // Return when catch a NotImplementedError
        if (e.name === "NotImplementedError")
            return {
                acc: 0,
                pp: "N/A",
                map
            };
      }

    return {
      acc: pp.computed_accuracy.value(),
      pp: pp.total.toFixed(2),
      map
    };
  }

  /**
   *
   * @param {string} prefix 前缀
   * @param {{ playInfo, mapInfo }} info
   * @param {number} group_id
   */
  async sendInfo(prefix, info, groupId) {
    const ppInfo = await this.getPP(info);
    // let hasOfflinePPCalc = true; // 是否离线计算了pp
    if (typeof ppInfo === 'string') {
      // hasOfflinePPCalc = false;
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
        // date,
        score,
        rank,
        enabled_mods: enabledMods
      },
      mapInfo: { beatmapset_id: beatmapsetId }
    } = info;
    const { acc, pp, map } = ppInfo;
    let message = `玩家${osuName}的${prefix}\n--------\n`;
    message += `${map.artist} - ${map.title}`;
    if (map.title_unicode || map.artist_unicode) {
      message += `(${map.artist_unicode} - ${map.title_unicode})`;
    }
    message += `[${map.version}] mapped by ${map.creator}\n`;
    message += `Url: https://osu.ppy.sh/beatmapsets/${beatmapsetId}\n\n`;
    message += `AR${parseFloat(map.ar.toFixed(2))} OD${parseFloat(
      map.od.toFixed(2)
    )} CS${parseFloat(map.cs.toFixed(2))} HP${parseFloat(map.hp.toFixed(2))}\n`;
    message += `${map.ncircles} circles, ${map.nsliders} sliders, ${map.nspinners} spinners\n\n`;
    message += `Score: ${score}\n`;
    message += `Rank: ${rank}\n`;
    message += `Mod: ${numberToOsuModes(enabledMods).join(' ')}\n`;
    message += `Acc: ${(acc * 100).toFixed(2)}%\n`;
    message += `Max Combo: ${maxcombo}/${map.max_combo()}\n`;
    message += `${count300}x300, ${count100}x100, ${count50}x50, ${countmiss}xmiss\n`;
    if (info.playInfo.pp) {
      message += `${parseFloat(info.playInfo.pp).toFixed(2)} pp (官方)\n`;
    }
    message += `${pp} pp (离线计算)`;
    logger.info(`格式化玩家'${osuName}'的${prefix}数据成功`);
    logger.info(`地图id: ${beatmapsetId}, 难度[${map.version}], ${pp} pp`);
    QQService.sendGroupMessage(groupId, message);
  }
}
