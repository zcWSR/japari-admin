"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _zlib = require("zlib");
var _axios = _interopRequireDefault(require("axios"));

var OSU = _interopRequireWildcard(require("ojsama"));
var _qqService = _interopRequireDefault(require("./qq-service"));
var _config = _interopRequireDefault(require("../config"));
var _logger = _interopRequireDefault(require("../utils/logger"));
var _osuUtils = require("../utils/osu-utils");
var _stringUtils = require("../utils/string-utils");function _getRequireWildcardCache() {if (typeof WeakMap !== "function") return null;var cache = new WeakMap();_getRequireWildcardCache = function _getRequireWildcardCache() {return cache;};return cache;}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;}if (obj === null || typeof obj !== "object" && typeof obj !== "function") {return { default: obj };}var cache = _getRequireWildcardCache();if (cache && cache.has(obj)) {return cache.get(obj);}var newObj = {};var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;if (desc && (desc.get || desc.set)) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}newObj.default = obj;if (cache) {cache.set(obj, newObj);}return newObj;}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {var symbols = Object.getOwnPropertySymbols(object);if (enumerableOnly) symbols = symbols.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});keys.push.apply(keys, symbols);}return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i] != null ? arguments[i] : {};if (i % 2) {ownKeys(Object(source), true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));} else {ownKeys(Object(source)).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}

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
  3: 'osu!mania' };


let dbInstance = null;
let serviceInstance = null;

class OSUService {constructor() {this.
    instance = null;}
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

  fetch(url, params, config) {return _asyncToGenerator(function* () {
      let retryTimes = 0;
      let meta;
      while (retryTimes < 3) {
        try {
          meta = yield (0, _axios.default)(_objectSpread({
            url,
            params: Object.assign(
            {
              k: _config.default.OSU_APP_KEY },

            params),

            // eslint-disable-next-line no-mixed-operators
            timeout: Math.pow(3, retryTimes + 1) * 1000 },
          config));

          retryTimes = 10;
        } catch (e) {
          retryTimes += 1;
          _logger.default.error(`请求: ${url} 发生错误:`);
          _logger.default.error(e.toString());
          _logger.default.error(`正在进行第${retryTimes}次重试`);
        }
      }
      if (retryTimes === 3) {
        _logger.default.error(`请求: ${url} 失败`);
        return null;
      }
      return meta.data || null;})();
  }

  getBoundInfo(groupId, userId) {return _asyncToGenerator(function* () {
      const meta = yield dbInstance('osu_bind').
      where({ group_id: groupId, user_id: userId }).
      first();
      if (meta) {
        return (0, _stringUtils.objKeyToSmallCamel)(meta, '_');
      }
      return meta;})();
  }

  getUserByName(osuName, mode = 0) {var _this = this;return _asyncToGenerator(function* () {
      const users = yield _this.fetch(GET_USER_URL, {
        u: osuName,
        type: 'string',
        mode });

      if (!users || !users.length) {
        const message = `获取玩家'${osuName}'的信息失败, ${
        !users ? '请求出错' : '用户不存在'
        }`;
        _logger.default.warn(message);
        return message;
      }
      return users[0];})();
  }

  bindOSUId(groupId, userId, osuName, mode = 0) {var _this2 = this;return _asyncToGenerator(function* () {
      const isBind = yield _this2.getBoundInfo(groupId, userId);
      const user = yield _this2.getUserByName(osuName, mode);
      if (typeof user === 'string') {
        return user;
      }
      let message;
      if (isBind) {
        yield dbInstance('osu_bind').
        update({
          osu_id: user.user_id,
          osu_name: osuName,
          mode }).

        where({ user_id: userId, group_id: groupId });
        message = `更新账号绑定为'${osuName}', 模式: ${modeMap[mode]}`;
      } else {
        yield dbInstance('osu_bind').insert({
          user_id: userId,
          group_id: groupId,
          osu_id: user.user_id,
          osu_name: osuName,
          mode });

        message = `账号'${osuName}'绑定成功, 模式: ${modeMap[mode]}`;
      }
      _logger.default.info(`qq${userId}${message}`);
      return message;})();
  }

  unBindOSUId(groupId, userId) {var _this3 = this;return _asyncToGenerator(function* () {
      const isBind = yield _this3.getBoundInfo(groupId, userId);
      if (!isBind) {
        const message = '未绑定任何账号, 无法解除绑定';
        _logger.default.warn(`qq${userId}${message}`);
        return message;
      }
      yield dbInstance('osu_bind').where({ group_id: groupId, user_id: userId }).del();
      return '解绑成功';})();
  }

  getBP(userInfo, index) {var _this4 = this;return _asyncToGenerator(function* () {
      // console.log(JSON.stringify(userInfo, null, 2));
      index = index || 1;
      const playInfos = yield _this4.fetch(GET_BP_URL, {
        u: userInfo.osuId,
        m: userInfo.mode,
        type: 'id',
        limit: index });

      if (!playInfos || !playInfos.length) {
        const message = `获取${userInfo.osuName}的bp#${index}失败, ${
        !playInfos ? '请求出错' : '不存在bp数据'
        }, 请重试`;
        _logger.default.warn(message);
        return message;
      }
      const playInfo = playInfos.reverse()[0];
      const mapsInfo = yield _this4.fetch(GET_MAP_URL, {
        b: playInfo.beatmap_id });

      if (!mapsInfo || !mapsInfo.length) {
        const message = `信息失败, ${!mapsInfo ? '请求出错' : 'beatmap不存在'}, 请重试`;
        _logger.default.warn(`获取beatmap${playInfo.beatmap_id}${message}`);
        return `获取beatmap${message}`;
      }
      const mapInfo = mapsInfo[0];
      return { playInfo: _objectSpread({ osu_name: userInfo.osuName }, playInfo), mapInfo };})();
  }

  getRecent(userInfo, index) {var _this5 = this;return _asyncToGenerator(function* () {
      index = index || 1;
      const playInfos = yield _this5.fetch(GET_RECENT_URL, {
        u: userInfo.osuId,
        m: userInfo.mode,
        type: 'id',
        limit: index || 1 });

      if (!playInfos || !playInfos.length) {
        const message = `获取${userInfo.osuName}的recent#${index}失败, ${
        !playInfos ? '请求出错' : '不存在recent数据'
        }, 请重试`;
        _logger.default.warn(message);
        return message;
      }
      const playInfo = playInfos.reverse()[0];
      const mapsInfo = yield _this5.fetch(GET_MAP_URL, {
        b: playInfo.beatmap_id });

      if (!mapsInfo || !mapsInfo.length) {
        const message = `信息失败, ${!mapsInfo ? '请求出错' : 'beatmap不存在'}, 请重试`;
        _logger.default.warn(`获取beatmap${playInfo.beatmap_id}${message}`);
        return `获取beatmap${message}`;
      }
      const mapInfo = mapsInfo[0];
      return { playInfo: _objectSpread({ osu_name: userInfo.osuName }, playInfo), mapInfo };})();
  }

  getMap(mapId) {var _this6 = this;return _asyncToGenerator(function* () {
      const meta = yield dbInstance('osu_map').where('id', mapId).first();
      if (meta) {
        return (0, _zlib.unzipSync)(Buffer.from(meta.map, 'base64')).toString();
      }
      const map = yield _this6.fetch(`${GET_OSU_FILE_UTL}/${mapId}`, null, {
        responseType: 'text' });

      if (!map) {
        return null;
      }
      const mapZip = (0, _zlib.deflateSync)(map).toString('base64');
      yield dbInstance('osu_map').insert({ id: mapId, map: mapZip });
      return map;})();
  }

  getPP(info) {var _this7 = this;return _asyncToGenerator(function* () {const _info$playInfo =











      info.playInfo,beatMapId = _info$playInfo.beatmap_id,enabledMods = _info$playInfo.enabled_mods,maxcombo = _info$playInfo.maxcombo,countmiss = _info$playInfo.countmiss,count50 = _info$playInfo.count50,count100 = _info$playInfo.count100,count300 = _info$playInfo.count300;
      const mapString = yield _this7.getMap(beatMapId);
      if (!mapString) {
        const message = '铺面信息失败';
        _logger.default.warn(`获取${beatMapId}${message}, 无法计算pp`);
        return `获取${message}, 请重试`;
      }
      // eslint-disable-next-line
      const parser = new OSU.parser();
      parser.feed(mapString);const
      map = parser.map;
      // eslint-disable-next-line new-cap
      let pp = null;
      try {
        // eslint-disable-next-line new-cap
        const stars = new OSU.diff().calc({
          map,
          mods: +enabledMods });

        pp = OSU.ppv2({
          stars,
          combo: +maxcombo,
          nmiss: +countmiss,
          n50: +count50,
          n100: +count100,
          n300: +count300 });

      } catch (e) {
        // mode 不支持
        if (e.name === 'NotImplementedError') {
          return { map };
        }
        e.message = '未知错误';
        throw e;
      }

      return {
        acc: pp.computed_accuracy.value(),
        pp: pp.total.toFixed(2),
        map };})();

  }

  /**
   *
   * @param {string} prefix 前缀
   * @param {{ playInfo, mapInfo }} info
   * @param {number} group_id
   */
  sendInfo(prefix, info, groupId) {var _this8 = this;return _asyncToGenerator(function* () {
      const ppInfo = yield _this8.getPP(info);
      // let hasOfflinePPCalc = true; // 是否离线计算了pp
      if (typeof ppInfo === 'string') {
        // hasOfflinePPCalc = false;
        _qqService.default.sendGroupMessage(groupId, ppInfo);
        return;
      }const _info$playInfo2 =














      info.playInfo,osuName = _info$playInfo2.osu_name,maxcombo = _info$playInfo2.maxcombo,count50 = _info$playInfo2.count50,count100 = _info$playInfo2.count100,count300 = _info$playInfo2.count300,countmiss = _info$playInfo2.countmiss,score = _info$playInfo2.score,rank = _info$playInfo2.rank,enabledMods = _info$playInfo2.enabled_mods,beatmapsetId = info.mapInfo.beatmapset_id;const
      acc = ppInfo.acc,pp = ppInfo.pp,map = ppInfo.map;
      let message = `玩家${osuName}的${prefix}\n--------\n`;
      message += `${map.artist} - ${map.title}`;
      if (map.title_unicode || map.artist_unicode) {
        message += `(${map.artist_unicode} - ${map.title_unicode})`;
      }
      message += `[${map.version}] mapped by ${map.creator}\n`;
      message += `Url: https://osu.ppy.sh/beatmapsets/${beatmapsetId}\n\n`;
      message += `AR${parseFloat(map.ar.toFixed(2))} OD${parseFloat(
      map.od.toFixed(2))
      } CS${parseFloat(map.cs.toFixed(2))} HP${parseFloat(map.hp.toFixed(2))}\n`;
      message += `${map.ncircles} circles, ${map.nsliders} sliders, ${map.nspinners} spinners\n\n`;
      message += `Score: ${score}\n`;
      message += `Rank: ${rank}\n`;
      message += `Mod: ${(0, _osuUtils.numberToOsuModes)(enabledMods).join(' ')}\n`;
      message += acc ? `Acc: ${(acc * 100).toFixed(2)}%\n` : 'Acc: N/A\n';
      message += `Max Combo: ${maxcombo}/${map.max_combo()}\n`;
      message += `${count300}x300, ${count100}x100, ${count50}x50, ${countmiss}xmiss\n`;
      if (info.playInfo.pp) {
        message += `${parseFloat(info.playInfo.pp).toFixed(2)} pp (官方)\n`;
      }
      if (pp) {
        message += `${pp} pp (离线计算)`;
      }
      _logger.default.info(`格式化玩家'${osuName}'的${prefix}数据成功`);
      _logger.default.info(`地图id: ${beatmapsetId}, 难度[${map.version}], ${pp} pp`);
      _qqService.default.sendGroupMessage(groupId, message);})();
  }}exports.default = OSUService;