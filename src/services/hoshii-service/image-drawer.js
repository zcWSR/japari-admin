import { createCanvas } from 'canvas';
import TopText from './top-text';
import BottomText from './bottom-text';

export default class Drawer {
  constructor(topText, bottomText) {
    this.topText = new TopText(topText, 'NotoSansSC');
    this.bottomText = new BottomText(bottomText, 'NotoSerifSC');
    this.bottomLeftShift = 180;
    this.width = 0;
    this.height = 0;
  }

  measureAll(padding, spacing) {
    const [pt, pr, pb, pl] = padding;
    // 增加倾斜量修正
    this.topText.x = pl + this.topText.height * 0.45;
    this.topText.y = pt;
    this.bottomText.x = this.topText.x + this.bottomLeftShift;
    this.bottomText.y = this.topText.y + spacing + this.topText.height;
    this.width =
      Math.max(
        this.topText.x + this.topText.width,
        this.bottomText.x + this.bottomText.width
      ) + pr;
    this.height = this.bottomText.y + this.bottomText.height + pb;
    this.topText.fixYPosition();
    this.bottomText.fixYPosition();
  }

  draw() {
    this.measureAll([20, 0, 20, 60], 30);
    const canvas = createCanvas(this.width, this.height);
    this.ctx = canvas.getContext('2d');
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.fill();
    this.topText.draw(this.ctx);
    this.bottomText.draw(this.ctx);
    return canvas;
  }
}
