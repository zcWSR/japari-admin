"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _path = _interopRequireDefault(require("path"));
var _canvas = require("canvas");
var _textMeasurer = _interopRequireDefault(require("../../utils/text-measurer"));
var _logger = _interopRequireDefault(require("../../utils/logger"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}

const BG_IMG_FOLDER = _path.default.resolve(__dirname, '../../../res/img/akhr/bg');
const CHARA_IMG_FOLDER = _path.default.resolve(__dirname, '../../../res/img/akhr/chara');

const BG_COLOR = '#ECEFF1';

const STAFF_LEVEL_BOX_COLOR_MAP = {
  1: '#343a40',
  2: '#f8f9fa',
  3: '#28a745',
  4: '#17a2b8',
  5: '#ffc107',
  6: '#dc3545' };


const TEXT_COLOR = {
  WHITE: 'white',
  BLACK: '#212529' };


const STAFF_LEVEL_FONT_COLOR_MAP = {
  1: TEXT_COLOR.WHITE,
  2: TEXT_COLOR.BLACK,
  3: TEXT_COLOR.WHITE,
  4: TEXT_COLOR.WHITE,
  5: TEXT_COLOR.BLACK,
  6: TEXT_COLOR.WHITE };

class Loader {
  constructor() {
    this.imageCache = {};
  }

  loadImage(src) {var _this = this;return _asyncToGenerator(function* () {
      if (_this.imageCache[src]) {
        return _this.imageCache[src];
      }
      return new Promise((resolve, reject) => {
        const img = new _canvas.Image();
        img.onload = () => {
          _this.imageCache[src] = img;
          resolve(img);
        };
        img.onerror = e => {
          reject(e);
        };
        img.src = src;
      });})();
  }}


class Drawer {
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
    this.measurer = _textMeasurer.default.getInstance('SourceHanSansSC');
    this.loader = new Loader();
  }

  getBgImgPath() {
    return `${BG_IMG_FOLDER}/${Math.floor(Math.random() * 70)}.png`;
  }

  getStaffImgPath(name) {
    return `${CHARA_IMG_FOLDER}/${name}.png`;
  }

  addImagePath(pointer, src, width, height, errorBackGround, borderRadius) {var _this2 = this;return _asyncToGenerator(function* () {
      let image = null;
      try {
        image = yield _this2.loader.loadImage(src);
      } catch (e) {
        _logger.default.debug('load image error, use default error color ');
      }
      _this2.paths.push({
        type: 'image',
        x: pointer.x,
        y: pointer.y,
        width,
        height,
        image,
        bgColor: errorBackGround,
        borderRadius });})();

  }

  addPureBoxPath(pointer, width, height, backgroundColor) {
    this.paths.push({
      type: 'rect',
      x: pointer.x,
      y: pointer.y,
      width,
      height,
      color: backgroundColor });

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
  doNotDraw)
  {const _this$measurer$text =
    this.measurer.text(text, fontSize),width = _this$measurer$text.width,height = _this$measurer$text.height;
    const boxWidth = width + paddingHorizontal * 2;
    const rectPath = {
      type: 'rect',
      x: pointer.x,
      y: pointer.y,
      height: boxHeight,
      width: boxWidth,
      color: boxColor,
      borderRadius };

    const textPath = {
      type: 'text',
      height,
      x: pointer.x + paddingHorizontal,
      y: pointer.y + (boxHeight - height) / 2,
      fontSize,
      color,
      content: text };

    if (!doNotDraw) {
      this.paths.push(rectPath);
      this.paths.push(textPath);
    }
    const resetXY = p => {
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
        textPath };

    }
    return { boxWidth, resetXY };
  }

  addImageTextBoxPath(
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
  doNotDraw)
  {var _this3 = this;return _asyncToGenerator(function* () {const _this3$measurer$text =
      _this3.measurer.text(text, fontSize),width = _this3$measurer$text.width,height = _this3$measurer$text.height;
      let image = null;
      try {
        image = yield _this3.loader.loadImage(imageSrc);
      } catch (e) {
        _logger.default.debug(e);
        _logger.default.debug('image load error, use default error color');
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
        borderRadius };

      const imagePath = {
        type: 'image',
        x: pointer.x + paddingHorizontal,
        y: pointer.y + imageMarginVertical,
        height: imageHeight,
        width: imageWidth,
        bgColor: imageErrorColor,
        image,
        borderRadius: imageBorderRadius };

      const textPath = {
        type: 'text',
        height,
        x: pointer.x + paddingHorizontal + imageWidth + imageMarginRight,
        y: pointer.y + (boxHeight - height) / 2,
        fontSize,
        color,
        content: text };

      const resetXY = p => {
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
          textPath };

      }
      return { boxWidth, resetXY };})();
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
    6);

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
    true);

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
    true);

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
    true);

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
      color: TEXT_COLOR.BLACK });

    this.height += titleHeight;
    this.height += 20; // marginTop
    const boxHeight = 70;
    const pointer = { x: 0, y: this.height };
    this.hrList.words.forEach(word => {const _this$addTagTextBox =
      this.addTagTextBox(pointer, word, boxHeight),boxWidth = _this$addTagTextBox.boxWidth,resetXY = _this$addTagTextBox.resetXY;
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
    (result, tag, index) => {const _this$getTagTextBox =
      this.getTagTextBox(startPointer, tag, tagsHeight),rectPath = _this$getTagTextBox.rectPath,textPath = _this$getTagTextBox.textPath;
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
    { height: 0, paths: [] });

  }

  getStaffsPath(startPointer, maxWidth, staffs) {var _this4 = this;return _asyncToGenerator(function* () {
      const boxHeight = _this4.withStaffImage ? 80 : 70;
      const paddingBottom = 20;
      let lineCount = 1;
      let width = 0;
      const startX = startPointer.x;
      const paths = yield staffs.reduce( /*#__PURE__*/function () {var _ref = _asyncToGenerator(function* (result, staff) {
          result = yield result;
          const getPathFunc = _this4[_this4.withStaffImage ? 'getStaffImageTextBox' : 'getStaffTextBox'];const _yield$getPathFunc$ca = yield (


            getPathFunc.call(
            _this4,
            startPointer,
            staff,
            boxHeight)),boxWidth = _yield$getPathFunc$ca.boxWidth,resetXY = _yield$getPathFunc$ca.resetXY,rectPath = _yield$getPathFunc$ca.rectPath,textPath = _yield$getPathFunc$ca.textPath,imagePath = _yield$getPathFunc$ca.imagePath;

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
          if (_this4.withStaffImage) {
            result.push(imagePath);
          }
          result.push(textPath);
          return result;
        });return function (_x, _x2) {return _ref.apply(this, arguments);};}(), Promise.resolve([]));
      return {
        height: boxHeight * lineCount + paddingBottom * (lineCount - 1),
        paths };})();

  }

  addRowPath({ tags, staffs }, index) {var _this5 = this;return _asyncToGenerator(function* () {
      const rowPadding = 16;
      const tagsContainerMaxWidth = 240;
      const staffsMaxWidth = _this5.width - tagsContainerMaxWidth;
      const tagsStartPointer = { x: rowPadding, y: _this5.height + rowPadding };
      const staffsStartPointer = { x: tagsContainerMaxWidth, y: _this5.height + rowPadding };const _this5$getCombineTags =
      _this5.getCombineTagsPath(
      tagsStartPointer,
      tags),tagsHeight = _this5$getCombineTags.height,tagPaths = _this5$getCombineTags.paths;const _yield$_this5$getStaf = yield (

        _this5.getStaffsPath(
        staffsStartPointer,
        staffsMaxWidth,
        staffs,
        true)),staffsHeight = _yield$_this5$getStaf.height,staffPaths = _yield$_this5$getStaf.paths;

      const maxHeight = Math.max(tagsHeight, staffsHeight) + rowPadding * 2;
      _this5.addPureBoxPath(
      { x: 0, y: _this5.height },
      _this5.width,
      maxHeight,
      index % 2 ? 'transparent' : 'rgba(0,0,0,.1)');

      _this5.paths = _this5.paths.concat(tagPaths, staffPaths);
      _this5.height += maxHeight;})();
  }

  addContentPath() {var _this6 = this;return _asyncToGenerator(function* () {
      _this6.height += 20; // marginTop
      const combined = _this6.hrList.combined;
      // eslint-disable-next-line guard-for-in, no-restricted-syntax
      for (const index in combined) {
        yield _this6.addRowPath(combined[index], index);
      }})();
  }

  getPath() {var _this7 = this;return _asyncToGenerator(function* () {
      _this7.addTitlePath();
      yield _this7.addContentPath();})();
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
    color, x, y, width, height, borderRadius })
  {
    this.ctx.fillStyle = color;
    if (!borderRadius) {
      this.ctx.fillRect(x, y, width, height);
      return;
    }
    this.drawRadiusRect(x, y, width, height, borderRadius);
    this.ctx.fill();
  }

  drawImage({
    x, y, width, height, image, bgColor = 'white', borderRadius })
  {
    if (!image && bgColor) {
      this.drawRect({
        color: bgColor,
        x,
        y,
        width,
        height,
        borderRadius });

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

  draw() {var _this8 = this;return _asyncToGenerator(function* () {
      yield _this8.getPath();
      const domWidth = _this8.width + _this8.padding * 2;
      const domHeight = _this8.height + _this8.padding * 2;
      const canvas = (0, _canvas.createCanvas)(domWidth, domHeight);
      _this8.ctx = canvas.getContext('2d');
      _this8.ctx.fillStyle = BG_COLOR;
      _this8.ctx.fillRect(0, 0, domWidth, domHeight);
      _this8.ctx.fill();

      const bgImage = yield _this8.loader.loadImage(_this8.getBgImgPath());

      const imgWidth = Math.min(_this8.width, _this8.height) * 0.7;
      const imgHeigh = imgWidth * (bgImage.height / bgImage.width);
      _this8.drawImage({
        x: domWidth - imgWidth,
        y: domHeight - imgHeigh,
        width: imgWidth,
        height: imgHeigh,
        image: bgImage,
        bgColor: BG_COLOR });

      _this8.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      _this8.ctx.fillRect(0, 0, domWidth, domHeight);
      _this8.ctx.fill();

      _this8.ctx.translate(_this8.padding, _this8.padding);
      _this8.paths.forEach(p => {
        switch (p.type) {
          case 'text':
            _this8.drawText(p);
            break;
          case 'rect':
            _this8.drawRect(p);
            break;
          case 'image':
            _this8.drawImage(p);
            break;
          default:}

      });
      return canvas;})();
  }}exports.default = Drawer;