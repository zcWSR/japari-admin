"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;

var _imageDrawer = _interopRequireDefault(require("./image-drawer"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} // import fs from 'fs';
// import path from 'path';
class HoShiiService {
  drawImage(topText, bottomText) {
    const drawer = new _imageDrawer.default(topText, bottomText);
    const draw = drawer.draw();
    // const stream = draw.createPNGStream();
    // const filePath = path.resolve(__dirname, '../../../res/outPut.png');
    // const out = fs.createWriteStream(filePath, { flags: 'w' });
    // stream.pipe(out);
    // out.on('finish', () => {
    //   console.log('write file to:');
    //   console.log(filePath);
    // });
    return draw.toBuffer('image/png').toString('base64');
  }}var _default =


new HoShiiService();exports.default = _default;