import { registerFont, createCanvas } from 'canvas';

export default class Measurer {
  static instanceMap = {};
  static registerFont(fontPath, name) {
    registerFont(fontPath, { family: name });
  }

  static getInstance(fontFamily) {
    if (!Measurer.instanceMap[fontFamily]) {
      Measurer.instanceMap[fontFamily] = new Measurer(fontFamily);
    }
    return Measurer.instanceMap[fontFamily];
  }

  constructor(fontFamily) {
    const canvas = createCanvas(0, 0);
    this.ctx = canvas.getContext('2d');
    this.fontFamily = fontFamily;
    this.cache = {};
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
}
