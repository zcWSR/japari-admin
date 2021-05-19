"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _textMeasurer = _interopRequireDefault(require("../../utils/text-measurer"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

class Text {
  constructor(value, fontFamily) {
    this.value = this.parseText(value);
    this.fontFamily = fontFamily;
    this.fontSize = 100;
    this.measurer = _textMeasurer.default.getInstance(fontFamily);
    this.textBaseLineToTop = 0;
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.measureText();
  }

  parseText(text) {
    return text.replaceAll('！', '!').trim();
  }

  measureText() {
    this.textMetrics = this.measurer.origin(this.value, this.fontSize);const _this$textMetrics =
    this.textMetrics,actualBoundingBoxAscent = _this$textMetrics.actualBoundingBoxAscent,actualBoundingBoxDescent = _this$textMetrics.actualBoundingBoxDescent;
    this.width = this.textMetrics.width;
    this.height = Math.abs(actualBoundingBoxAscent) + Math.abs(actualBoundingBoxDescent);
    this.textBaseLineToTop = Math.abs(actualBoundingBoxAscent);
  }

  // y 默认是从顶部开始算的，但 strokeText 是从 baseline 位置开始画，修正下 y 的值
  fixYPosition() {
    this.y += this.textBaseLineToTop;
  }}exports.default = Text;