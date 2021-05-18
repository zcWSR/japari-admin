"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _canvas = require("canvas");
var _topText = _interopRequireDefault(require("./top-text"));
var _bottomText = _interopRequireDefault(require("./bottom-text"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _slicedToArray(arr, i) {return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();}function _nonIterableRest() {throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");}function _unsupportedIterableToArray(o, minLen) {if (!o) return;if (typeof o === "string") return _arrayLikeToArray(o, minLen);var n = Object.prototype.toString.call(o).slice(8, -1);if (n === "Object" && o.constructor) n = o.constructor.name;if (n === "Map" || n === "Set") return Array.from(o);if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);}function _arrayLikeToArray(arr, len) {if (len == null || len > arr.length) len = arr.length;for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];return arr2;}function _iterableToArrayLimit(arr, i) {if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i["return"] != null) _i["return"]();} finally {if (_d) throw _e;}}return _arr;}function _arrayWithHoles(arr) {if (Array.isArray(arr)) return arr;}

class Drawer {
  constructor(topText, bottomText) {
    this.topText = new _topText.default(topText, 'Noto Sans SC');
    this.bottomText = new _bottomText.default(bottomText, 'Noto Serif SC');
    this.bottomLeftShift = 180;
    this.width = 0;
    this.height = 0;
  }

  measureAll(padding, spacing) {const _padding = _slicedToArray(
    padding, 4),pt = _padding[0],pr = _padding[1],pb = _padding[2],pl = _padding[3];
    // 增加倾斜量修正
    this.topText.x = pl + this.topText.height * 0.45;
    this.topText.y = pt;
    this.bottomText.x = this.topText.x + this.bottomLeftShift;
    this.bottomText.y = this.topText.y + this.topText.height + spacing;
    this.width = this.bottomText.x + this.bottomText.width + pr;
    this.height = this.bottomText.y + this.bottomText.height + pb;
    this.topText.fixYPosition();
    this.bottomText.fixYPosition();
  }

  draw() {
    this.measureAll([20, 70, 20, 70], 30);
    const canvas = (0, _canvas.createCanvas)(this.width, this.height);
    this.ctx = canvas.getContext('2d');
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.fill();
    this.topText.draw(this.ctx);
    this.bottomText.draw(this.ctx);
    return canvas;
  }}exports.default = Drawer;