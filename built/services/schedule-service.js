"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _momentTimezone = _interopRequireDefault(require("moment-timezone"));
var _nodeSchedule = _interopRequireWildcard(require("node-schedule"));
var _logger = _interopRequireDefault(require("../utils/logger"));
var _qqService = _interopRequireDefault(require("./qq-service"));function _getRequireWildcardCache() {if (typeof WeakMap !== "function") return null;var cache = new WeakMap();_getRequireWildcardCache = function _getRequireWildcardCache() {return cache;};return cache;}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;}if (obj === null || typeof obj !== "object" && typeof obj !== "function") {return { default: obj };}var cache = _getRequireWildcardCache();if (cache && cache.has(obj)) {return cache.get(obj);}var newObj = {};var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;if (desc && (desc.get || desc.set)) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}newObj.default = obj;if (cache) {cache.set(obj, newObj);}return newObj;}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _slicedToArray(arr, i) {return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();}function _nonIterableRest() {throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");}function _unsupportedIterableToArray(o, minLen) {if (!o) return;if (typeof o === "string") return _arrayLikeToArray(o, minLen);var n = Object.prototype.toString.call(o).slice(8, -1);if (n === "Object" && o.constructor) n = o.constructor.name;if (n === "Map" || n === "Set") return Array.from(o);if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);}function _arrayLikeToArray(arr, len) {if (len == null || len > arr.length) len = arr.length;for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];return arr2;}function _iterableToArrayLimit(arr, i) {if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i["return"] != null) _i["return"]();} finally {if (_d) throw _e;}}return _arr;}function _arrayWithHoles(arr) {if (Array.isArray(arr)) return arr;}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}

const DAY_NAME_MAP = {
  0: '星期天',
  1: '星期一',
  2: '星期二',
  3: '星期三',
  4: '星期四',
  5: '星期五',
  6: '星期六',
  7: '星期天' };


class ScheduleService {constructor() {this.
    db = null;}
  setDBInstance(instance) {
    this.db = instance;
  }

  getAllSchedule() {
    return this.db('schedule').select('*');
  }

  getScheduleNameByGroupId(groupId) {var _this = this;return _asyncToGenerator(function* () {
      const meta = yield _this.db('schedule').first('name').where('group_id', groupId);
      if (!meta) return null;
      return meta.name;})();
  }

  getScheduleByGroupId(groupId) {
    return this.db('schedule').first().where('group_id', groupId);
  }

  getRuleFromString(ruleString) {
    // eslint-disable-next-line prefer-const
    let _ruleString$split = ruleString.split(' '),_ruleString$split2 = _slicedToArray(_ruleString$split, 2),hourString = _ruleString$split2[0],_ruleString$split2$ = _ruleString$split2[1],dayString = _ruleString$split2$ === void 0 ? 'everyday' : _ruleString$split2$;
    let hours = hourString.split(',').reduce((result, hour) => {
      hour = parseInt(hour, 10);
      if (hour >= 0 && hour <= 23 && result.indexOf(hour) === -1) {
        result.push(hour);
      }
      return result;
    }, []);
    if (!hours.length) {
      hours = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    }
    hours = hours.sort();
    if (dayString === 'weekend' || dayString === '周末') {
      dayString = '6,7';
    }
    if (dayString === 'weekday' || dayString === '工作日') {
      dayString = '1,2,3,4,5';
    }
    if (dayString === 'everyday' || dayString === '每天') {
      dayString = '1,2,3,4,5,6,7';
    }
    let days = dayString.split(',').reduce((result, day) => {
      day = parseInt(day, 10);
      if (day >= 0 && day <= 7 && result.indexOf(day) === -1) {
        result.push(day);
      }
      return result;
    }, []);
    if (!days.length) {
      days = [1, 2, 3, 4, 5];
    }
    days = days.sort();
    return {
      rule: `0 0 ${hours.join(',')} ? * ${days.join(',')}`,
      hours,
      days };

  }

  // function addZero(number, wantLength) {
  //   return `0000000000${number}`.slice(-wantLength);
  // }

  formatText(text) {
    const now = (0, _momentTimezone.default)(new Date()).tz('Asia/Shanghai');
    return text.
    replace(/\\n/g, '\n').
    replace(/\$\{hour\}/g, now.hours()).
    replace(/\$\{minute\}/g, now.minutes()).
    replace(/\$\{second\}/g, now.seconds()).
    replace(/\$\{year\}/g, now.year()).
    replace(/\$\{month\}/g, now.month() + 1).
    replace(/\$\{date\}/g, now.date()).
    replace(/\$\{day\}/g, DAY_NAME_MAP[now.day()]);
  }

  sendText(groupId, text) {
    const formattedText = this.formatText(text);
    _logger.default.info('auto sendText to', groupId, formattedText);
    _qqService.default.sendGroupMessage(groupId, formattedText);
  }

  runSchedule(groupId, name, ruleString, text) {const _this$getRuleFromStri =
    this.getRuleFromString(ruleString),hours = _this$getRuleFromStri.hours,days = _this$getRuleFromStri.days,rule = _this$getRuleFromStri.rule;
    _logger.default.info(`rule '${rule}'`);
    (0, _nodeSchedule.scheduleJob)(
    name,
    { rule, tz: 'Asia/Shanghai' },
    this.sendText.bind(this, groupId, text));

    return { hours, days };
  }

  runAllSchedule() {var _this2 = this;return _asyncToGenerator(function* () {
      try {
        const all = yield _this2.getAllSchedule();
        // eslint-disable-next-line object-curly-newline
        all.forEach(({ group_id: groupId, name, rule: ruleString, text }) => {
          _this2.runSchedule(groupId, name, ruleString, text);
          _logger.default.info(`run schedule '${name}'`);
        });
      } catch (e) {
        _logger.default.error(e);
      } finally {
        _logger.default.info('start all schedule');
      }})();
  }

  cancelSchedule(name) {
    const job = _nodeSchedule.default.scheduledJobs[name];
    if (job) {
      job.cancel();
    }
  }

  setSchedule(groupId, rule, text) {var _this3 = this;return _asyncToGenerator(function* () {
      const name = yield _this3.getScheduleNameByGroupId(groupId);
      if (name) {
        _this3.cancelSchedule(name);
      }
      const newName = `s-${groupId}`;const _this3$runSchedule =
      _this3.runSchedule(groupId, newName, rule, text),hours = _this3$runSchedule.hours,days = _this3$runSchedule.days;
      if (name) {
        yield _this3.db('schedule').
        update({
          name: newName,
          rule: `${hours.join(',')} ${days.join(',')}`,
          text }).

        where('group_id', groupId);
      } else {
        yield _this3.db('schedule').insert({
          group_id: groupId,
          name: newName,
          rule: `${hours.join(',')} ${days.join(',')}`,
          text });

      }
      return { hours, days };})();
  }

  removeSchedule(groupId, name) {var _this4 = this;return _asyncToGenerator(function* () {
      // const schedule = await getScheduleByGroupId(groupId);
      // if (!schedule) {
      //   return -1;
      // }
      _this4.cancelSchedule(name);
      yield _this4.db('schedule').where('group_id', groupId).del();
      return 0;})();
  }

  ruleToShownString(hours, days) {
    let result = '';

    if (days[0] === 6 && days.length === 2) {
      result = '每周末的';
    } else if (
    days[0] === 1 &&
    days.indexOf(6) === -1 &&
    days.indexOf(7) === -1 &&
    days.length === 5)
    {
      result = '每周工作日的';
    } else if (days[0] === 1 && days.length === 7) {
      result = '每天的';
    } else {
      result = `${days.
      reduce((prev, current) => `${prev}${DAY_NAME_MAP[current]}、`, '每周').
      slice(0, -1)}的`;
    }

    return hours.reduce((prev, current) => `${prev}${current}点`, result);
  }}var _default =


new ScheduleService();exports.default = _default;