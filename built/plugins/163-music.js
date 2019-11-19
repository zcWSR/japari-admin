"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _axios = _interopRequireDefault(require("axios"));
var _config = _interopRequireDefault(require("../config"));
var _plugin = require("../decorators/plugin");
var _qqService = _interopRequireDefault(require("../services/qq-service"));
var _redisService = _interopRequireDefault(require("../services/redis-service"));
var _logger = _interopRequireDefault(require("../utils/logger"));var _dec, _class;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}function _slicedToArray(arr, i) {return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();}function _nonIterableRest() {throw new TypeError("Invalid attempt to destructure non-iterable instance");}function _iterableToArrayLimit(arr, i) {var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i["return"] != null) _i["return"]();} finally {if (_d) throw _e;}}return _arr;}function _arrayWithHoles(arr) {if (Array.isArray(arr)) return arr;}

const commandPrefixList = ['点歌', '来一首', '我想听'];

const MAX_COUNT_PRE_MINUTE = 2;

const MUSIC_ID_CACHE_KEY = '163-music-keyword-cache';let









NetEastMusic = (_dec = (0, _plugin.Plugin)({ name: '163-music', wight: 99, type: 'message', shortInfo: '网易云点歌', info: '网易云音乐点歌, 使用方法: 点歌 xx, 来一首 xx, 我想听 xx', mute: true }), _dec(_class = class NetEastMusic {
  getRedisKey(id) {
    return `163-music-${id}`;
  }

  isCommand(content) {
    let match = null;
    let prefix = null;
    commandPrefixList.some(p => {
      const result = content.match(new RegExp(`^${p}\\s(.*)$`));
      if (result) {
        match = result;
        prefix = p;
        return true;
      }
      return false;
    });
    if (match) {const _match =
      match,_match2 = _slicedToArray(_match, 2),keyword = _match2[1];
      return { prefix, keyword };
    }
    return false;
  }

  canSearch({ user_id: userId, group_id: groupId }, type) {var _this = this;return _asyncToGenerator(function* () {
      try {
        const id = type === 'group' ? groupId : userId;
        const key = _this.getRedisKey(id);let _split =
        ((yield _redisService.default.get(key)) || ',').split(','),_split2 = _slicedToArray(_split, 2),firstTime = _split2[0],count = _split2[1];
        const nowDateTime = Date.now();
        firstTime = +firstTime || nowDateTime;
        count = +count || 0;

        // 超过一分钟, 用当前时间重设, 次数重置为1, 并继续
        if (nowDateTime - firstTime > 1000 * 60) {
          yield _redisService.default.set(key, `${nowDateTime},1`);
          return true;
        }
        // 如不足最大限制次数, 则记录第一次调用时间和当前次数, 并继续
        if (count < MAX_COUNT_PRE_MINUTE) {
          yield _redisService.default.set(key, `${firstTime},${count + 1}`);
          return true;
        }
        // 如超过最大调用次数并在一分钟内, 则判定为过量, 阻止
        yield _redisService.default.set(key, `${firstTime},${count + 1}`);
        return false;
      } catch (e) {
        // 异常统一阻止
        _logger.default.error(e.toString());
        return false;
      }})();
  }

  checkKeywordCache(keyword) {return _asyncToGenerator(function* () {
      _logger.default.info(`checking music keyword cache: ${keyword}`);
      const result = yield _redisService.default.redis.hget(MUSIC_ID_CACHE_KEY, keyword);
      if (result) {
        _logger.default.info(`get keyword cache, id: ${result}`);
      } else {
        _logger.default.info('cache not found, fetching...');
      }
      return result;})();
  }

  setKeywordCache(keyword, id) {
    _logger.default.info(`set music keyword cache: ${keyword}, id: ${id}`);
    return _redisService.default.redis.hset(MUSIC_ID_CACHE_KEY, keyword, id);
  }

  getSearchUrl() {
    if (Math.random() > 0.5) {
      return `${_config.default.NET_EAST_MUSIC_SERVER}/search`;
    }
    return `${_config.default.NET_EAST_MUSIC_SERVER}/search/suggest`;
  }

  fetchMusic(keyword) {var _this2 = this;return _asyncToGenerator(function* () {
      _logger.default.info(`search music with keyword: ${keyword}`);
      try {
        const meta = yield (0, _axios.default)({
          url: _this2.getSearchUrl(),
          method: 'get',
          params: {
            keywords: keyword,
            limit: 1,
            type: 1 } });const _meta$data$result =


        meta.data.result,result = _meta$data$result === void 0 ? {} : _meta$data$result;
        if (!result.songs || !result.songs.length) {
          _logger.default.info('search no result');
          return `无 '${keyword}' 的搜索结果`;
        }const _result$songs = _slicedToArray(
        result.songs, 1),song = _result$songs[0];
        _logger.default.info(`search success, music title: ${song.name}, id: ${song.id}`);
        return song;
      } catch (e) {
        if (e.isAxiosError && e.response && e.response.data) {const
          msg = e.response.data.msg;
          return msg;
        }
        _logger.default.info('search failed');
        _logger.default.error(e.toString());
        return null;
      }})();
  }

  doSearch(keyword) {var _this3 = this;return _asyncToGenerator(function* () {
      let id = yield _this3.checkKeywordCache(keyword);
      if (!id) {
        const result = yield _this3.fetchMusic(keyword);
        if (result === null) {
          return '请求失败, 请重试';
        }
        if (typeof result === 'string' && result) {
          return result;
        }
        // eslint-disable-next-line
        id = result.id;
        yield _this3.setKeywordCache(keyword, id);
      }
      return _this3.buildScheme(id);})();
  }

  buildScheme(id) {
    return `[CQ:music,type=163,id=${id}]`;
  }

  sendMessage(msg, body, type) {
    if (type === 'group') {
      _qqService.default.sendGroupMessage(body.group_id, msg);
    }
    if (type === 'private') {
      _qqService.default.sendPrivateMessage(body.user_id, msg);
    }
  }

  go(body, type) {var _this4 = this;return _asyncToGenerator(function* () {const
      message = body.message;
      const c = _this4.isCommand(message);
      if (!c) return; // 不是指令, 直接跳过流程
      if (yield _this4.canSearch(body, type)) {
        const msg = yield _this4.doSearch(c.keyword);
        _this4.sendMessage(msg, body, type);
      } else {
        _this4.sendMessage(`每分钟最多可点${MAX_COUNT_PRE_MINUTE}首, 请稍后重试`, body, type);
      }
      return 'break';})();
  }}) || _class);var _default =

NetEastMusic;exports.default = _default;