"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _axios = _interopRequireDefault(require("axios"));
var _redisService = _interopRequireDefault(require("./redis-service"));
var _logger = _interopRequireDefault(require("../utils/logger"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}

const HSO_SET_KEY = 'hso-cache';
const HSO_PLUS_SET_KEY = 'hso-plus-cache';

class HsoService {
  fetchHsoList(plusMode) {return _asyncToGenerator(function* () {
      try {
        const page = Math.ceil(Math.random() * 100);
        _logger.default.info(`fetching hso ${plusMode ? 'plus ' : ''}list at page ${page}...`);
        const meta = yield (0, _axios.default)({
          url: `http://konachan.${plusMode ? 'com' : 'net'}/post.json`,
          params: {
            limit: 60,
            page },

          headers: {
            'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36' } });


        if (meta.data.length) {
          return meta.data;
        }
        throw new Error('请求失败');
      } catch (e) {
        _logger.default.error('fetch hso error');
        throw e;
      }})();
  }

  clearSet(plusMode) {
    return _redisService.default.redis.del(plusMode ? HSO_PLUS_SET_KEY : HSO_SET_KEY);
  }

  addHsoListToRedis(hsoList, plusMode) {return _asyncToGenerator(function* () {
      const formatList = hsoList.map(hso => JSON.stringify({
        id: hso.id,
        source: hso.source,
        preview: hso.preview_url,
        sample: hso.sample_url,
        plus: plusMode }));

      yield _redisService.default.redis.sadd(plusMode ? HSO_PLUS_SET_KEY : HSO_SET_KEY, ...formatList);})();
  }

  getOne(plusMode, newList) {var _this = this;return _asyncToGenerator(function* () {
      let hsoString;
      if (!newList) {
        hsoString = yield _redisService.default.redis.spop(plusMode ? HSO_PLUS_SET_KEY : HSO_SET_KEY);
      }
      if (!hsoString) {
        if (newList) {
          _logger.default.info(`hso ${plusMode ? 'plus ' : ''}list refresh`);
        } else {
          _logger.default.info(`hso ${plusMode ? 'plus ' : ''}list empty, do refetch`);
        }
        const hsoList = yield _this.fetchHsoList(plusMode);
        if (newList) {
          yield _this.clearSet(plusMode);
        }
        yield _this.addHsoListToRedis(hsoList, plusMode);
        return _this.getOne(plusMode);
      }
      const hso = JSON.parse(hsoString);
      _logger.default.info(`random pop one hso${plusMode ? ' plus' : ''}, id: ${hso.id}`);
      return hso;})();
  }

  buildMessage(hso) {
    return [
    {
      type: 'image',
      cache: 0,
      data: {
        file: hso.plus ? hso.preview : hso.sample } },


    {
      type: 'text',
      data: {
        text: hso.source ? `\n${hso.source}` : '' } }];



  }}var _default =


new HsoService();exports.default = _default;