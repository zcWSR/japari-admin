import Text from './text';

export default class TopText extends Text {
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
    ctx.strokeText(this.value, this.x + 4, this.y + 4);

    // 銀色
    {
      const grad = ctx.createLinearGradient(0, this.y - 81, 0, this.y + 17);
      grad.addColorStop(0.0, 'rgb(0,15,36)');
      grad.addColorStop(0.1, 'rgb(255,255,255)');
      grad.addColorStop(0.18, 'rgb(55,58,59)');
      grad.addColorStop(0.25, 'rgb(55,58,59)');
      grad.addColorStop(0.5, 'rgb(200,200,200)');
      grad.addColorStop(0.75, 'rgb(55,58,59)');
      grad.addColorStop(0.85, 'rgb(25,20,31)');
      grad.addColorStop(0.91, 'rgb(240,240,240)');
      grad.addColorStop(0.95, 'rgb(166,175,194)');
      grad.addColorStop(1, 'rgb(50,50,50)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 20;
      ctx.strokeText(this.value, this.x + 4, this.y + 4);
    }

    // 黒色
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 16;
    ctx.strokeText(this.value, this.x, this.y);

    // 金色
    {
      const grad = ctx.createLinearGradient(0, this.y - 85, 0, this.y - 5);
      grad.addColorStop(0, 'rgb(253,241,0)');
      grad.addColorStop(0.25, 'rgb(245,253,187)');
      grad.addColorStop(0.4, 'rgb(255,255,255)');
      grad.addColorStop(0.75, 'rgb(253,219,9)');
      grad.addColorStop(0.9, 'rgb(127,53,0)');
      grad.addColorStop(1, 'rgb(243,196,11)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 10;
      ctx.strokeText(this.value, this.x, this.y);
    }

    // 黒
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#000';
    ctx.strokeText(this.value, this.x + 2, this.y - 3);

    // 白
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#FFFFFF';
    ctx.strokeText(this.value, this.x, this.y - 3);

    // 赤
    {
      const grad = ctx.createLinearGradient(0, this.y - 85, 0, this.y - 5);
      grad.addColorStop(0, 'rgb(255,100,0)');
      grad.addColorStop(0.5, 'rgb(123,0,0)');
      grad.addColorStop(0.51, 'rgb(240,0,0)');
      grad.addColorStop(1, 'rgb(5,0,0)');
      ctx.lineWidth = 4;
      ctx.strokeStyle = grad;
      ctx.strokeText(this.value, this.x, this.y - 3);
    }

    // 赤
    {
      const grad = ctx.createLinearGradient(0, this.y - 85, 0, this.y - 5);
      grad.addColorStop(0, 'rgb(230,0,0)');
      grad.addColorStop(0.5, 'rgb(123,0,0)');
      grad.addColorStop(0.51, 'rgb(240,0,0)');
      grad.addColorStop(1, 'rgb(5,0,0)');
      ctx.fillStyle = grad;
      ctx.fillText(this.value, this.x, this.y - 3);
    }
  }
}
