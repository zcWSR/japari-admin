import path from 'path';
import { createCanvas, Image } from 'canvas';
import Measurer from '../../utils/text-measurer';
import logger from '../../utils/logger';

const BG_IMG_FOLDER = path.resolve(__dirname, '../../../res/img/akhr/bg');
const CHARA_IMG_FOLDER = path.resolve(__dirname, '../../../res/img/akhr/chara');

const BG_COLOR = '#ECEFF1';

const STAFF_LEVEL_BOX_COLOR_MAP = {
  1: '#343a40',
  2: '#f8f9fa',
  3: '#28a745',
  4: '#17a2b8',
  5: '#ffc107',
  6: '#dc3545'
};

const TEXT_COLOR = {
  WHITE: 'white',
  BLACK: '#212529'
};

const STAFF_LEVEL_FONT_COLOR_MAP = {
  1: TEXT_COLOR.WHITE,
  2: TEXT_COLOR.BLACK,
  3: TEXT_COLOR.WHITE,
  4: TEXT_COLOR.WHITE,
  5: TEXT_COLOR.BLACK,
  6: TEXT_COLOR.WHITE
};
class Loader {
  constructor() {
    this.imageCache = {};
  }

  async loadImage(src) {
    if (this.imageCache[src]) {
      return this.imageCache[src];
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.imageCache[src] = img;
        resolve(img);
      };
      img.onerror = (e) => {
        reject(e);
      };
      img.src = src;
    });
  }
}

export class Drawer {
  /**
   *
   * @param {HR_RESULT} hrList
   * @param {number} width
   * @param {number} padding
   */
  constructor(hrList, width, padding, withStaffImage) {
    this.hrList = hrList;
    this.width = width;
    this.padding = padding;
    this.height = 0;
    this.paths = [];
    this.withStaffImage = withStaffImage;
    this.measurer = Measurer.getInstance('SourceHanSansSC');
    this.loader = new Loader();
  }

  getBgImgPath() {
    return `${BG_IMG_FOLDER}/${Math.floor(Math.random() * 70)}.png`;
  }

  getStaffImgPath(name) {
    return `${CHARA_IMG_FOLDER}/${name}.png`;
  }

  async addImagePath(pointer, src, width, height, errorBackGround, borderRadius) {
    let image = null;
    try {
      image = await this.loader.loadImage(src);
    } catch (e) {
      logger.debug('load image error, use default error color ');
    }
    this.paths.push({
      type: 'image',
      x: pointer.x,
      y: pointer.y,
      width,
      height,
      image,
      bgColor: errorBackGround,
      borderRadius
    });
  }

  addPureBoxPath(pointer, width, height, backgroundColor) {
    this.paths.push({
      type: 'rect',
      x: pointer.x,
      y: pointer.y,
      width,
      height,
      color: backgroundColor
    });
  }

  addPureTextBoxPath(
    pointer,
    text,
    fontSize,
    paddingHorizontal,
    boxHeight,
    boxColor,
    color,
    borderRadius = 0,
    doNotDraw
  ) {
    const { width, height } = this.measurer.text(text, fontSize);
    const boxWidth = width + paddingHorizontal * 2;
    const rectPath = {
      type: 'rect',
      x: pointer.x,
      y: pointer.y,
      height: boxHeight,
      width: boxWidth,
      color: boxColor,
      borderRadius
    };
    const textPath = {
      type: 'text',
      height,
      x: pointer.x + paddingHorizontal,
      y: pointer.y + (boxHeight - height) / 2,
      fontSize,
      color,
      content: text
    };
    if (!doNotDraw) {
      this.paths.push(rectPath);
      this.paths.push(textPath);
    }
    const resetXY = (p) => {
      rectPath.x = p.x;
      rectPath.y = p.y;
      textPath.x = p.x + paddingHorizontal;
      textPath.y = p.y + (boxHeight - height) / 2;
    };
    if (doNotDraw) {
      return {
        boxWidth,
        resetXY,
        rectPath,
        textPath
      };
    }
    return { boxWidth, resetXY };
  }

  async addImageTextBoxPath(
    pointer,
    imageSrc,
    imageMarginVertical,
    imageMarginRight,
    text,
    fontSize,
    paddingHorizontal,
    boxHeight,
    boxColor,
    imageErrorColor,
    color,
    imageBorderRadius,
    borderRadius = 0,
    doNotDraw
  ) {
    const { width, height } = this.measurer.text(text, fontSize);
    let image = null;
    try {
      image = await this.loader.loadImage(imageSrc);
    } catch (e) {
      logger.debug(e);
      logger.debug('image load error, use default error color');
    }
    const imageHeight = boxHeight - imageMarginVertical * 2;
    const imageWidth = image ? imageHeight * (image.width / image.height) : imageHeight;
    const boxWidth = imageWidth + imageMarginRight + width + paddingHorizontal * 2;
    const rectPath = {
      type: 'rect',
      x: pointer.x,
      y: pointer.y,
      height: boxHeight,
      width: boxWidth,
      color: boxColor,
      borderRadius
    };
    const imagePath = {
      type: 'image',
      x: pointer.x + paddingHorizontal,
      y: pointer.y + imageMarginVertical,
      height: imageHeight,
      width: imageWidth,
      bgColor: imageErrorColor,
      image,
      borderRadius: imageBorderRadius
    };
    const textPath = {
      type: 'text',
      height,
      x: pointer.x + paddingHorizontal + imageWidth + imageMarginRight,
      y: pointer.y + (boxHeight - height) / 2,
      fontSize,
      color,
      content: text
    };
    const resetXY = (p) => {
      rectPath.x = p.x;
      rectPath.y = p.y;
      imagePath.x = p.x + paddingHorizontal;
      imagePath.y = p.y + imageMarginVertical;
      textPath.x = p.x + paddingHorizontal + imageWidth + imageMarginRight;
      textPath.y = p.y + (boxHeight - height) / 2;
    };
    if (doNotDraw) {
      return {
        boxWidth,
        resetXY,
        rectPath,
        imagePath,
        textPath
      };
    }
    return { boxWidth, resetXY };
  }

  addTagTextBox(pointer, tag, boxHeight) {
    return this.addPureTextBoxPath(
      pointer,
      tag,
      28,
      20,
      boxHeight,
      '#6c757d',
      TEXT_COLOR.WHITE,
      6
    );
  }

  getTagTextBox(pointer, tag, boxHeight) {
    return this.addPureTextBoxPath(
      pointer,
      tag,
      28,
      20,
      boxHeight,
      '#6c757d',
      TEXT_COLOR.WHITE,
      6,
      true
    );
  }

  getStaffTextBox(pointer, staff, boxHeight) {
    return this.addPureTextBoxPath(
      pointer,
      staff.name,
      28,
      20,
      boxHeight,
      STAFF_LEVEL_BOX_COLOR_MAP[staff.level],
      STAFF_LEVEL_FONT_COLOR_MAP[staff.level],
      6,
      true
    );
  }

  getStaffImageTextBox(pointer, staff, boxHeight) {
    return this.addImageTextBoxPath(
      pointer,
      this.getStaffImgPath(staff.name),
      6,
      10,
      staff.name,
      28,
      20,
      boxHeight,
      STAFF_LEVEL_BOX_COLOR_MAP[staff.level],
      'white',
      STAFF_LEVEL_FONT_COLOR_MAP[staff.level],
      6,
      6,
      true
    );
  }

  addTitlePath() {
    const content = '识别词条:';
    const titleFontSize = 40;
    const titleHeight = this.measurer.text(content, titleFontSize).height;
    this.paths.push({
      type: 'text',
      height: titleHeight,
      x: 0,
      y: 0,
      fontSize: titleFontSize,
      content,
      color: TEXT_COLOR.BLACK
    });
    this.height += titleHeight;
    this.height += 20; // marginTop
    const boxHeight = 70;
    const pointer = { x: 0, y: this.height };
    this.hrList.words.forEach((word) => {
      const { boxWidth, resetXY } = this.addTagTextBox(pointer, word, boxHeight);
      if (pointer.x + boxWidth > this.width) {
        // 一行放不下, 自动换行
        pointer.x = 0;
        pointer.y += boxHeight;
        pointer.y += 20; // marginBottom
        this.height = pointer.y;
        resetXY(pointer);
      }
      pointer.x += boxWidth;
      pointer.x += 20; // marginRight
    });
    if (this.hrList.words.length) {
      this.height += boxHeight;
    }
  }

  getCombineTagsPath(startPointer, tags) {
    const tagsHeight = 70;
    return tags.reduce(
      (result, tag, index) => {
        const { rectPath, textPath } = this.getTagTextBox(startPointer, tag, tagsHeight);
        startPointer.y += tagsHeight;
        result.height += tagsHeight;
        startPointer.y += 20; // marginBottom
        if (index < tags.length - 1) {
          result.height += 20;
        }
        result.paths.push(rectPath);
        result.paths.push(textPath);
        return result;
      },
      { height: 0, paths: [] }
    );
  }

  async getStaffsPath(startPointer, maxWidth, staffs) {
    const boxHeight = this.withStaffImage ? 80 : 70;
    const paddingBottom = 20;
    let lineCount = 1;
    let width = 0;
    const startX = startPointer.x;
    const paths = await staffs.reduce(async (result, staff) => {
      result = await result;
      const getPathFunc = this[this.withStaffImage ? 'getStaffImageTextBox' : 'getStaffTextBox'];
      const {
        boxWidth, resetXY, rectPath, textPath, imagePath
      } = await getPathFunc.call(
        this,
        startPointer,
        staff,
        boxHeight
      );
      if (width + boxWidth > maxWidth) {
        // 一行放不下, 自动换行
        startPointer.x = startX;
        width = 0;
        startPointer.y += boxHeight;
        startPointer.y += paddingBottom; // marginBottom
        lineCount += 1; // 记录新的一行
        resetXY(startPointer);
      }
      startPointer.x += boxWidth;
      startPointer.x += 20; // marginRight
      width += boxWidth;
      width += 20;
      result.push(rectPath);
      if (this.withStaffImage) {
        result.push(imagePath);
      }
      result.push(textPath);
      return result;
    }, Promise.resolve([]));
    return {
      height: boxHeight * lineCount + paddingBottom * (lineCount - 1),
      paths
    };
  }

  async addRowPath({ tags, staffs }, index) {
    const rowPadding = 16;
    const tagsContainerMaxWidth = 240;
    const staffsMaxWidth = this.width - tagsContainerMaxWidth;
    const tagsStartPointer = { x: rowPadding, y: this.height + rowPadding };
    const staffsStartPointer = { x: tagsContainerMaxWidth, y: this.height + rowPadding };
    const { height: tagsHeight, paths: tagPaths } = this.getCombineTagsPath(
      tagsStartPointer,
      tags
    );
    const { height: staffsHeight, paths: staffPaths } = await this.getStaffsPath(
      staffsStartPointer,
      staffsMaxWidth,
      staffs,
      true
    );
    const maxHeight = Math.max(tagsHeight, staffsHeight) + rowPadding * 2;
    this.addPureBoxPath(
      { x: 0, y: this.height },
      this.width,
      maxHeight,
      index % 2 ? 'transparent' : 'rgba(0,0,0,.1)'
    );
    this.paths = this.paths.concat(tagPaths, staffPaths);
    this.height += maxHeight;
  }

  async addContentPath() {
    this.height += 20; // marginTop
    const { combined } = this.hrList;
    // eslint-disable-next-line guard-for-in, no-restricted-syntax
    for (const index in combined) {
      await this.addRowPath(combined[index], index);
    }
  }

  async getPath() {
    this.addTitlePath();
    await this.addContentPath();
  }

  drawRadiusRect(x, y, width, height, borderRadius) {
    const r = borderRadius;
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + width - r, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    this.ctx.lineTo(x + width, y + height - r);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    this.ctx.lineTo(x + r, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
  }

  drawRect({
    color, x, y, width, height, borderRadius
  }) {
    this.ctx.fillStyle = color;
    if (!borderRadius) {
      this.ctx.fillRect(x, y, width, height);
      return;
    }
    this.drawRadiusRect(x, y, width, height, borderRadius);
    this.ctx.fill();
  }

  drawImage({
    x, y, width, height, image, bgColor = 'white', borderRadius
  }) {
    if (!image && bgColor) {
      this.drawRect({
        color: bgColor,
        x,
        y,
        width,
        height,
        borderRadius
      });
      return;
    }
    if (borderRadius) {
      this.ctx.save();
      this.drawRadiusRect(x, y, width, height, borderRadius);
      this.ctx.clip();
      this.ctx.drawImage(image, x, y, width, height);
      this.ctx.restore();
    } else {
      this.ctx.drawImage(image, x, y, width, height);
    }
  }

  drawText(textPath) {
    this.ctx.fillStyle = textPath.color;
    this.ctx.textBaseline = 'bottom';
    this.ctx.font = `${textPath.fontSize}px "SourceHanSansSC"`;
    this.ctx.fillText(textPath.content, textPath.x, textPath.y + textPath.height);
  }

  async draw() {
    await this.getPath();
    const domWidth = this.width + this.padding * 2;
    const domHeight = this.height + this.padding * 2;
    const canvas = createCanvas(domWidth, domHeight);
    this.ctx = canvas.getContext('2d');
    this.ctx.fillStyle = BG_COLOR;
    this.ctx.fillRect(0, 0, domWidth, domHeight);
    this.ctx.fill();

    const bgImage = await this.loader.loadImage(this.getBgImgPath());

    const imgWidth = Math.min(this.width, this.height) * 0.7;
    const imgHeigh = imgWidth * (bgImage.height / bgImage.width);
    this.drawImage({
      x: domWidth - imgWidth,
      y: domHeight - imgHeigh,
      width: imgWidth,
      height: imgHeigh,
      image: bgImage,
      bgColor: BG_COLOR
    });
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.fillRect(0, 0, domWidth, domHeight);
    this.ctx.fill();

    this.ctx.translate(this.padding, this.padding);
    this.paths.forEach((p) => {
      switch (p.type) {
        case 'text':
          this.drawText(p);
          break;
        case 'rect':
          this.drawRect(p);
          break;
        case 'image':
          this.drawImage(p);
          break;
        default:
      }
    });
    return canvas;
  }
}
