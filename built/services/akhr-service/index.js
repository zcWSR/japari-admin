"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _axios = _interopRequireDefault(require("axios"));
var _lodash = _interopRequireDefault(require("lodash"));
require("lodash.combinations");
var _redisService = _interopRequireDefault(require("../redis-service"));
var _config = _interopRequireDefault(require("../../config"));
var _logger = _interopRequireDefault(require("../../utils/logger"));
var _imageDrawer = require("./image-drawer");
var _env = require("../../utils/env");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}

// 更新用数据源 redis key
const AKHR_UPDATE_URL_KEY = 'akhr-update-url';
const AKHR_LIST_KEY = 'akhr-list';
const AKHR_LIST_EXPIRE_TIME = 60 * 60 * 24 * 7;

class AkhrService {constructor() {this.
    AKHR = void 0;}
  fetchMetaData(newUrl) {return _asyncToGenerator(function* () {
      let url = '';
      try {
        if (newUrl) {
          _logger.default.info('has new update url, update redis');
          yield _redisService.default.set(AKHR_UPDATE_URL_KEY, newUrl);
          url = newUrl;
        } else {
          _logger.default.info('get update url from redis');
          url = yield _redisService.default.get(AKHR_UPDATE_URL_KEY);
          if (!url) {
            _logger.default.info('no url find, use config as default');
            url = _config.default.AKHR_UPDATE_SERVER;
          }
        }
      } catch (e) {
        e.customErrorMsg = 'Redis url操作失败';
        throw e;
      }
      let meta;
      try {
        _logger.default.info('fetching akhr origin list...');
        meta = yield _axios.default.get(url);
      } catch (e) {
        e.customErrorMsg = '远端数据获取失败';
        throw e;
      }
      return meta.data;})();
  }

  formatMetaData(list) {
    const result = list.reduce(
    (prev, staff) => {const

      name =
      staff.name,level = staff.level,sex = staff.sex,type = staff.type,hidden = staff.hidden;const
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
      // 数据源列表存在name重复但内容不同的项目, 采用覆盖原则
      // 优先选择tag多的, 或者不隐藏的
      const staffCache = prev.staffMap[name];
      if (!staffCache || staffCache.tags.length < tags.length || !hidden) {
        prev.staffMap[name] = {
          tags,
          name,
          enName: staff['name-en'],
          level,
          hidden };

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

  updateAkhrList(newUrl) {var _this = this;return _asyncToGenerator(function* () {
      const metaList = yield _this.fetchMetaData(newUrl);
      try {
        const akhrList = _this.formatMetaData(metaList);
        yield _redisService.default.set(AKHR_LIST_KEY, JSON.stringify(akhrList));
        yield _redisService.default.redis.expire(AKHR_LIST_KEY, AKHR_LIST_EXPIRE_TIME);
        _this.AKHR_LIST = akhrList;
      } catch (e) {
        e.customErrorMsg = '格式转换或存储失败';
        throw e;
      }
      _logger.default.info('akhrList has been update');})();
  }

  getAkhrList() {var _this2 = this;return _asyncToGenerator(function* () {
      if (!_this2.AKHR_LIST) {
        const json = yield _redisService.default.get(AKHR_LIST_KEY);
        if (json) {
          _this2.AKHR_LIST = JSON.parse(json);
        } else {
          yield _this2.updateAkhrList();
        }
      }
      return _this2.AKHR_LIST;})();
  }

  combine(words, list) {
    // 过滤OCR识别出的文字, 只留tag名
    words = words.filter(word => list.tagMap[word]);
    // 组合, 3-1个tag的所有组合方式
    const combineTags = _lodash.default.flatMap([3, 2, 1], count => _lodash.default.combinations(words, count));
    const data = combineTags.reduce((result, tags) => {
      // 取不同tag的干员的交集
      const staffNames = _lodash.default.intersection(...tags.map(tag => list.tagMap[tag]));
      // 干员等级总和, 后排序用
      let levelSum = 0;
      // 根据干员名反查干员信息, 并
      let staffs = staffNames.reduce((staffList, name) => {
        const staff = list.staffMap[name];
        // 过滤
        if (
        staff &&
        !staff.hidden // 不在公招池里的
        && !(staff.level === 6 && tags.indexOf('高级资深干员') === -1) // 6星,但是没有高级资深干员tag
        ) {
            levelSum += staff.level;
            staffList.push(staff);
          }
        return staffList;
      }, []);
      // 按星级排序
      staffs = staffs.sort((a, b) => b.level - a.level);
      if (staffs.length) {
        result.push({
          tags,
          averageLevel: levelSum / staffs.length,
          staffs });

      }
      return result;
    }, []);
    return {
      words,
      // 按平均等级排序
      combined: data.sort((a, b) => b.averageLevel - a.averageLevel) };

  }

  getORCResult(imgUrl) {return _asyncToGenerator(function* () {
      if ((0, _env.isDev)()) {
        return ['辅助干员', '先锋干员', '远程位', '新手', '费用回复'];
      }
      const meta = yield (0, _axios.default)({
        url: 'https://api.ocr.space/parse/imageurl',
        params: {
          apikey: _config.default.OCR_KEY,
          url: imgUrl,
          language: 'chs' } });


      if (Array.isArray(meta.data.ParsedResults)) {
        const ocrString = meta.data.ParsedResults[0].ParsedText || '';
        return ocrString.
        replace(/\r\n$/, '').
        replace(/冫口了/g, '治疗').
        split('\r\n');
      }
      throw new Error(`ocr parse error\n${meta.data.ErrorMessage.join('\n')}`);})();
  }

  parseTextOutput(result) {const
    words = result.words,combined = result.combined;
    let text = `识别词条: ${words.join('、')}\n\n`;
    text += combined.
    map(({ tags, staffs }) => {
      const staffsWithLevel = staffs.map(({ level, name }) => `(${level})${name}`);
      return `【${tags.join('+')}】${staffsWithLevel.join(' ')}`;
    }).
    join('\n==========\n');
    return text;
  }

  parseImageOutPut(result, withStaffImage) {return _asyncToGenerator(function* () {
      try {
        const drawer = new _imageDrawer.Drawer(result, 1200, 20, withStaffImage);
        const draw = yield drawer.draw();
        // const stream = draw.createPNGStream();
        // const filePath = path.resolve(__dirname, '../../../res/', `outPut${Date.now()}.png`);
        // const out = fs.createWriteStream(filePath);
        // stream.pipe(out);
        // out.on('finish', () => {
        //   console.log('write file to:');
        //   console.log(filePath);
        //   done('done');
        // });
        return draw.toBuffer('image/jpeg').toString('base64');
      } catch (e) {
        throw e;
      }})();
  }}var _default =


new AkhrService();exports.default = _default;