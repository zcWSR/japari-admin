import Measurer from '../../utils/text-measurer';

export default class Text {
  constructor(value, fontFamily) {
    this.value = this.parseText(value);
    this.fontFamily = fontFamily;
    this.fontSize = 100;
    this.measurer = Measurer.getInstance(fontFamily);
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
    this.textMetrics = this.measurer.origin(this.value, this.fontSize);
    const { actualBoundingBoxAscent, actualBoundingBoxDescent } = this.textMetrics;
    this.width = this.textMetrics.width;
    this.height = Math.abs(actualBoundingBoxAscent) + Math.abs(actualBoundingBoxDescent);
    this.textBaseLineToTop = Math.abs(actualBoundingBoxAscent);
  }

  // y 默认是从顶部开始算的，但 strokeText 是从 baseline 位置开始画，修正下 y 的值
  fixYPosition() {
    this.y += this.textBaseLineToTop;
  }
}
