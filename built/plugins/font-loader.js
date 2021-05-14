"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _path = _interopRequireDefault(require("path"));
var _plugin = require("../decorators/plugin");
var _textMeasurer = _interopRequireDefault(require("../utils/text-measurer"));var _dec, _class;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}let







FontLoader = (_dec = (0, _plugin.Plugin)({ name: 'font-loader', weight: 1, type: null, // 类型为空, 不添加到插件队列内
  mute: true }), _dec(_class = class FontLoader {init() {
    _textMeasurer.default.registerFont(
    _path.default.resolve(__dirname, '../../res/font/SourceHanSansSC-Regular.otf'),
    'SourceHanSansSC');

    _textMeasurer.default.registerFont(
    _path.default.resolve(__dirname, '../../res/font/NotoSansSC-Regular.otf'),
    'NotoSansSC');

    _textMeasurer.default.registerFont(
    _path.default.resolve(__dirname, '../../res/font/NotoSerifSC-Regular.otf'),
    'NotoSerifSC');

  }}) || _class);var _default =


FontLoader;exports.default = _default;