"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _canvas = require("canvas");

class Measurer {

  static registerFont(fontPath, name) {
    (0, _canvas.registerFont)(fontPath, { family: name });
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
    const canvas = (0, _canvas.createCanvas)(0, 0);
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
        height: measure.actualBoundingBoxDescent };

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
  }}exports.default = Measurer;Measurer.instanceMap = {};