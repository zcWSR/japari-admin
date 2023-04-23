import { GlobalFonts, createCanvas } from '@napi-rs/canvas';

export default class Measurer {
  static instanceMap = {};
  static registerFont(fontPath, name) {
    console.log(fontPath, name)
    GlobalFonts.registerFromPath(fontPath, name);
  }

  /**
   * singleton
   * @param {string} fontFamily fontFamily
   * @returns {Measurer} instance
   */
  static getInstance(fontFamily) {
    if (!Measurer.instanceMap[fontFamily]) {
      Measurer.instanceMap[fontFamily] = new Measurer(fontFamily);
    }
    return Measurer.instanceMap[fontFamily];
  }

  constructor(fontFamily) {
    // 不可为 0 0，会报错
    const canvas = createCanvas(1, 1);
    this.ctx = canvas.getContext('2d');
    this.fontFamily = fontFamily;
    this.cache = {};
    // 原始数据缓存
    this.originCache = {};
  }

  text(text, fontSize = 16) {
    const key = `${text}${fontSize}`;
    if (!this.cache[key]) {
      this.ctx.textBaseline = 'top';
      this.ctx.font = `${fontSize}px "${this.fontFamily}"`;
      const measure = this.ctx.measureText(text);
      const result = {
        width: measure.width,
        height: measure.actualBoundingBoxDescent
      };
      this.cache[key] = result;
    }
    return this.cache[key];
  }

  /**
   * get origin measure object
   * @param {*} text text value
   * @param {*} fontSize fontSize
   * @returns {TextMetrics} TextMetrics
   */
  origin(text, fontSize) {
    const key = `${text}${fontSize}`;
    if (!this.originCache[key]) {
      this.ctx.font = `${fontSize}px "${this.fontFamily}"`;
      const measure = this.ctx.measureText(text);
      this.originCache[key] = measure;
    }
    return this.originCache[key];
  }
}
