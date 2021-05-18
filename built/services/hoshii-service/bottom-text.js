"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _text = _interopRequireDefault(require("./text"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

class BottomText extends _text.default {
  /**
   * 绘制
   * @param {CanvasRenderingContext2D} ctx context
   */
  draw(ctx) {
    ctx.font = `${this.fontSize}px "${this.fontFamily}"`;
    ctx.setTransform(1, 0, -0.45, 1, 0, 0);
    // 黒色
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 22;
    ctx.strokeText(this.value, this.x + 5, this.y + 2);

    // 銀
    {
      const grad = ctx.createLinearGradient(0, this.y - 80, 0, this.y + 18);
      grad.addColorStop(0, 'rgb(0,15,36)');
      grad.addColorStop(0.25, 'rgb(250,250,250)');
      grad.addColorStop(0.5, 'rgb(150,150,150)');
      grad.addColorStop(0.75, 'rgb(55,58,59)');
      grad.addColorStop(0.85, 'rgb(25,20,31)');
      grad.addColorStop(0.91, 'rgb(240,240,240)');
      grad.addColorStop(0.95, 'rgb(166,175,194)');
      grad.addColorStop(1, 'rgb(50,50,50)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 19;
      ctx.strokeText(this.value, this.x + 5, this.y + 2);
    }

    // 黒色
    ctx.strokeStyle = '#10193A';
    ctx.lineWidth = 17;
    ctx.strokeText(this.value, this.x, this.y);

    // 白
    ctx.strokeStyle = '#DDD';
    ctx.lineWidth = 8;
    ctx.strokeText(this.value, this.x, this.y);

    // 紺
    {
      const grad = ctx.createLinearGradient(0, this.y - 80, 0, this.y);
      grad.addColorStop(0, 'rgb(16,25,58)');
      grad.addColorStop(0.03, 'rgb(255,255,255)');
      grad.addColorStop(0.08, 'rgb(16,25,58)');
      grad.addColorStop(0.2, 'rgb(16,25,58)');
      grad.addColorStop(1, 'rgb(16,25,58)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 7;
      ctx.strokeText(this.value, this.x, this.y);
    }

    // 銀
    {
      const grad = ctx.createLinearGradient(0, this.y - 80, 0, this.y);
      grad.addColorStop(0, 'rgb(245,246,248)');
      grad.addColorStop(0.15, 'rgb(255,255,255)');
      grad.addColorStop(0.35, 'rgb(195,213,220)');
      grad.addColorStop(0.5, 'rgb(160,190,201)');
      grad.addColorStop(0.51, 'rgb(160,190,201)');
      grad.addColorStop(0.52, 'rgb(196,215,222)');
      grad.addColorStop(1.0, 'rgb(255,255,255)');
      ctx.fillStyle = grad;
      ctx.fillText(this.value, this.x, this.y - 3);
    }
  }}exports.default = BottomText;