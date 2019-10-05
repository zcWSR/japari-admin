"use strict";require("core-js/modules/es.array.filter");require("core-js/modules/es.array.flat-map");require("core-js/modules/es.array.from");require("core-js/modules/es.array.iterator");require("core-js/modules/es.array.map");require("core-js/modules/es.array.unscopables.flat-map");require("core-js/modules/es.promise");require("core-js/modules/es.set");require("core-js/modules/es.string.replace");require("core-js/modules/es.string.split");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _axios = _interopRequireDefault(require("axios"));
var _lodash = _interopRequireDefault(require("lodash"));
require("lodash.combinations");
var _redisService = _interopRequireDefault(require("./redis-service"));
var _config = _interopRequireDefault(require("../config"));
var _logger = _interopRequireDefault(require("../utils/logger"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}

const AKHR_LIST_KEY = 'akhr-list';

class AkhrService {constructor() {this.
    AKHR = void 0;}
  fetchMetaData() {return _asyncToGenerator(function* () {
      _logger.default.info('fetching akhr origin list...');
      const meta = yield _axios.default.get('https://graueneko.github.io/akhr.json');
      return meta.data;})();
  }

  formatMetaData(list) {
    const result = list.reduce(
    (prev, staff) => {const

      name =
      staff.name,level = staff.level,sex = staff.sex,type = staff.type;const
      tags = staff.tags;
      tags.push(`${sex}性干员`);
      tags.push(`${type}干员`);
      if (level === 6) {
        tags.push('高级资深干员');
      }
      tags.forEach(tag => {
        if (!prev.tagMap[tag]) prev.tagMap[tag] = new Set();
        prev.tagMap[tag].add(name);
      });
      if (!prev.staffMap[name]) {
        prev.staffMap[name] = {
          tags,
          name,
          level };

      }
      return prev;
    },
    { tagMap: {}, staffMap: {} });

    result.tagMap = Object.keys(result.tagMap).reduce((prev, tag) => {
      prev[tag] = Array.from(result.tagMap[tag]);
      return prev;
    }, {});
    return result;
  }

  updateAkhrList() {var _this = this;return _asyncToGenerator(function* () {
      const metaList = yield _this.fetchMetaData();
      const akhrList = _this.formatMetaData(metaList);
      yield _redisService.default.set(AKHR_LIST_KEY, JSON.stringify(akhrList));
      _this.AKHR_LIST = akhrList;
      _logger.default.info('akhrList has been update');})();
  }

  getAkhrList() {var _this2 = this;return _asyncToGenerator(function* () {
      if (!_this2.AKHR_LIST) {
        const json = yield _redisService.default.get(AKHR_LIST_KEY);
        _this2.AKHR_LIST = JSON.parse(json);
      }
      return _this2.AKHR_LIST;})();
  }

  combine(words, list) {
    words = words.filter(word => list.tagMap[word]);
    const combineTags = _lodash.default.flatMap([3, 2, 1], count => _lodash.default.combinations(words, count));
    const data = combineTags.reduce((result, tags) => {
      const staffs = _lodash.default.intersection(...tags.map(tag => list.tagMap[tag]));
      if (staffs.length) {
        result.push({
          tags,
          staffs });

      }
      return result;
    }, []);
    return {
      words,
      combined: data };

  }

  parseTextOutput(list, result) {const
    words = result.words,combined = result.combined;
    let text = `识别词条: ${words.split('、')}\n\n`;
    text += combined.
    map(({ tags, staffs }) => {
      const staffsWithLevel = staffs.map(staff => {const _list$staffMap$staff =
        list.staffMap[staff],level = _list$staffMap$staff.level,name = _list$staffMap$staff.name;
        return `(${level})${name}`;
      });
      return `【${tags.join('+')}】${staffsWithLevel.join(' ')}`;
    }).
    join('\n==========\n');
    return text;
  }

  getORCResult(imgUrl) {return _asyncToGenerator(function* () {
      const meta = yield (0, _axios.default)({
        url: 'https://api.ocr.space/parse/imageurl',
        params: {
          apikey: _config.default.OCR_KEY,
          url: encodeURIComponent(imgUrl),
          language: 'chs' } });


      if (Array.isArray(meta.data.ParsedResults)) {
        const ocrString = meta.data.ParsedResults[0].ParsedText || '';
        return ocrString.
        replace(/\r\n$/, '').
        replace(/冫口了/g, '治疗').
        split('\r\n');
      }
      throw new Error('ocr parse error');})();
  }}var _default =


new AkhrService();exports.default = _default;