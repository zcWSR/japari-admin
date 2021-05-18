"use strict";



var _fontLoader = _interopRequireDefault(require("../plugins/font-loader"));
var _hoshiiService = _interopRequireDefault(require("../services/hoshii-service"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} // import test from './akhr';
// test();
new _fontLoader.default().init();
_hoshiiService.default.drawImage('这是一条', '测试语句');