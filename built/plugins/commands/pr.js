"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _plugin = require("../../decorators/plugin");
var _qqService = _interopRequireDefault(require("../../services/qq-service"));var _dec, _class;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}let









Roll = (_dec = (0, _plugin.Command)({ name: 'pr', command: 'pr', type: 'group', info: '舔', default: true, level: 1 }), _dec(_class = class Roll {
  noPr() {
    return Math.random() < 0.1;
  }

  run(params, body) {
    let content = 'prpr';
    if (params) {
      content = `舔舔${params}`;
    }
    if (this.noPr()) {
      content = '不舔了, 舔不动了';
    }
    _qqService.default.sendGroupMessage(body.group_id, content);
  }}) || _class);var _default =


Roll;exports.default = _default;