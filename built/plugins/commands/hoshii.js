"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _plugin = require("../../decorators/plugin");
var _qqService = _interopRequireDefault(require("../../services/qq-service"));
var _hoshiiService = _interopRequireDefault(require("../../services/hoshii-service"));
var _logger = _interopRequireDefault(require("../../utils/logger"));var _dec, _class;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _slicedToArray(arr, i) {return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();}function _nonIterableRest() {throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");}function _unsupportedIterableToArray(o, minLen) {if (!o) return;if (typeof o === "string") return _arrayLikeToArray(o, minLen);var n = Object.prototype.toString.call(o).slice(8, -1);if (n === "Object" && o.constructor) n = o.constructor.name;if (n === "Map" || n === "Set") return Array.from(o);if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);}function _arrayLikeToArray(arr, len) {if (len == null || len > arr.length) len = arr.length;for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];return arr2;}function _iterableToArrayLimit(arr, i) {if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i["return"] != null) _i["return"]();} finally {if (_d) throw _e;}}return _arr;}function _arrayWithHoles(arr) {if (Array.isArray(arr)) return arr;}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}let








AkhrUpdate = (_dec = (0, _plugin.Command)({ name: '5000兆円表情包生成器', command: 'hoshii', type: 'all', info: 'http://yurafuca.com/5000choyen/ 翻版', level: 1 }), _dec(_class = class AkhrUpdate {
  sendMsg(body, type, msg) {
    if (type === 'group') {
      _qqService.default.sendGroupMessage(body.group_id, msg);
    } else if (type === 'private') {
      _qqService.default.sendPrivateMessage(body.user_id, msg);
    }
  }

  sendImg(body, type, dataUrl) {
    if (type === 'group') {
      _qqService.default.sendGroupImage(body.group_id, dataUrl);
    } else if (type === 'private') {
      _qqService.default.sendPrivateImage(body.user_id, dataUrl);
    }
  }

  run(params, body, type) {var _this = this;return _asyncToGenerator(function* () {const _params$trim$split =
      params.trim().split(/\s+/),_params$trim$split2 = _slicedToArray(_params$trim$split, 2),topText = _params$trim$split2[0],bottomText = _params$trim$split2[1];
      if (!bottomText) {
        _this.sendMsg(body, type, '非法参数');
        return;
      }
      _logger.default.info(`getting img from message: ${topText} ${bottomText}`);
      const dataUrl = _hoshiiService.default.drawImage(topText, bottomText);
      _this.sendImg(body, type, dataUrl);})();
  }}) || _class);var _default =


AkhrUpdate;exports.default = _default;