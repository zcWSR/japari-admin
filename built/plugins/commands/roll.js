"use strict";require("core-js/modules/es.string.split");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _plugin = require("../../decorators/plugin");
var _qqService = _interopRequireDefault(require("../../services/qq-service"));var _dec, _class;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}let









Roll = (_dec = (0, _plugin.Command)({ name: '随机数', command: 'roll', type: 'all', info: '随机roll一个整, \'!roll xxx\'来调用(不传递参数默认上限为100)', default: true, level: 1 }), _dec(_class = class Roll {
  sendMessage(type, body, content) {
    if (type === 'group') {
      _qqService.default.sendGroupMessage(body.group_id, `roll: ${content}`);
    } else if (type === 'private') {
      _qqService.default.sendPrivateMessage(body.user_id, `roll: ${content}`);
    }
  }

  roll(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  run(params, body, type) {
    const range = params.split(' ');
    const max = +range[0] || 100;
    const min = range[1] || 0;
    this.sendMessage(type, body, this.roll(min, max));
  }}) || _class);var _default =


Roll;exports.default = _default;