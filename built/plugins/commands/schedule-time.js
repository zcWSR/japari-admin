"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _plugin = require("../../decorators/plugin");
var _qqService = _interopRequireDefault(require("../../services/qq-service"));
var _scheduleService = _interopRequireDefault(require("../../services/schedule-service"));var _dec, _class;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _slicedToArray(arr, i) {return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();}function _nonIterableRest() {throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");}function _unsupportedIterableToArray(o, minLen) {if (!o) return;if (typeof o === "string") return _arrayLikeToArray(o, minLen);var n = Object.prototype.toString.call(o).slice(8, -1);if (n === "Object" && o.constructor) n = o.constructor.name;if (n === "Map" || n === "Set") return Array.from(o);if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);}function _arrayLikeToArray(arr, len) {if (len == null || len > arr.length) len = arr.length;for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];return arr2;}function _iterableToArrayLimit(arr, i) {if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i["return"] != null) _i["return"]();} finally {if (_d) throw _e;}}return _arr;}function _arrayWithHoles(arr) {if (Array.isArray(arr)) return arr;}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}

// eslint-disable-next-line no-template-curly-in-string
const DEFAULT_TEXT = '${hour}点了!';let









ScheduleTime = (_dec = (0, _plugin.Command)({ name: '设置定时内容时间', command: 'scheduleTime', type: 'group', info: "设置定时任务时间, '!scheduleTime xxx yyy' 来调用\nxxx为每日几时执行, 为数字, 例如 '6,7,8' '23', 区间0-23, 用逗号分隔\nyyy为周几执行, 可以不填, 默认为每天\n可设为 '每天' 或 'everyday', '工作日' 或 'weekday', '周末' 或 'weekend', 或用数字表示, 区间0-7, 用逗号分隔", level: 2 }), _dec(_class = class ScheduleTime {
  run(params, body) {return _asyncToGenerator(function* () {const
      groupId = body.group_id;
      if (!params) {
        _qqService.default.sendGroupMessage(groupId, '参数非法, 请输入必要参数');
        return;
      }const _params$split =

      params.split(' '),_params$split2 = _slicedToArray(_params$split, 2),hourString = _params$split2[0],_params$split2$ = _params$split2[1],dayString = _params$split2$ === void 0 ? 'weekend' : _params$split2$;
      if (
      !(
      hourString.match(/^([1-2]?[0-9],?)+$/) &&
      dayString.match(/^(weekend|周末|everyday|每天|workday|工作日)|(([1-7],?)+)$/)))

      {
        _qqService.default.sendGroupMessage(groupId, '参数非法');
        return;
      }
      const currentSchedule = yield _scheduleService.default.getScheduleByGroupId(groupId);
      let result = '设置成功\n';const _yield$ScheduleServic = yield (
        _scheduleService.default.setSchedule(
        groupId,
        params,
        currentSchedule ? currentSchedule.text : DEFAULT_TEXT)),hours = _yield$ScheduleServic.hours,days = _yield$ScheduleServic.days;

      if (!currentSchedule) {
        result += _scheduleService.default.ruleToShownString(hours, days);
        result += "\n执行默认内容: 'x点了!'";
      } else {
        result += _scheduleService.default.ruleToShownString(hours, days);
        result += `\n执行内容: ${currentSchedule.text}`;
      }
      _qqService.default.sendGroupMessage(groupId, result);})();
  }}) || _class);var _default =


ScheduleTime;exports.default = _default;