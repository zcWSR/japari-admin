"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _plugin = require("../../decorators/plugin");
var _qqService = _interopRequireDefault(require("../../services/qq-service"));
var _scheduleService = _interopRequireDefault(require("../../services/schedule-service"));var _dec, _class;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}let










Schedule = (_dec = (0, _plugin.Command)({ name: '设置定时内容', command: 'schedule', type: 'group', info: // eslint-disable-next-line no-template-curly-in-string
  "设置定时显示文字内容, '!schedule 内容' 来调用\n内容不写为查看当前配置\n'!schedule clear' 为清除当前配置\n提供参数 year month date day hour minute second, 用${xxx}来插入", level: 3 }), _dec(_class = class Schedule {run(params, body) {return _asyncToGenerator(function* () {const
      groupId = body.group_id;
      const currentSchedule = yield _scheduleService.default.getScheduleByGroupId(groupId);
      if (currentSchedule) {const _ScheduleService$getR =
        _scheduleService.default.getRuleFromString(currentSchedule.rule),hours = _ScheduleService$getR.hours,days = _ScheduleService$getR.days;
        let result = '';
        if (!params) {
          result = '当前设定:\n';
          result += `${_scheduleService.default.ruleToShownString(hours, days)}`;
          result += `\n执行内容: ${currentSchedule.text}`;
        } else if (params === 'clear') {
          yield _scheduleService.default.removeSchedule(
          currentSchedule.group_id,
          currentSchedule.name);

          _qqService.default.sendGroupMessage(groupId, '已清除定时内容');
          return;
        } else {const _yield$ScheduleServic = yield (
            _scheduleService.default.setSchedule(
            groupId,
            currentSchedule.rule,
            params)),newHours = _yield$ScheduleServic.hours,newDays = _yield$ScheduleServic.days;

          result = '设置成功\n';
          result += _scheduleService.default.ruleToShownString(newHours, newDays);
          result += `\n执行内容: ${params}`;
        }
        _qqService.default.sendGroupMessage(groupId, result);
        return;
      }
      _qqService.default.sendGroupMessage(
      groupId,
      "任务不存在, 请先使用指令 '!scheduleTime' 设置任务内容时间");})();

  }}) || _class);var _default =


Schedule;exports.default = _default;