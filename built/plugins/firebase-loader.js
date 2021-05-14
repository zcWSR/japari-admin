"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _plugin = require("../decorators/plugin");
var _firebaseService = _interopRequireDefault(require("../services/firebase-service"));var _dec, _class;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}let







FirebaseLoader = (_dec = (0, _plugin.Plugin)({ name: 'firebase-loader', weight: 1, type: null, // 类型为空, 不添加到插件队列内
  mute: true }), _dec(_class = class FirebaseLoader {init() {
    _firebaseService.default.init();
  }}) || _class);var _default =


FirebaseLoader;exports.default = _default;