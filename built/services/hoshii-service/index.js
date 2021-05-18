"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _imageDrawer = _interopRequireDefault(require("./image-drawer"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}

class HoShiiService {
  drawImage(topText, bottomText) {return _asyncToGenerator(function* () {
      const drawer = new _imageDrawer.default(topText, bottomText);
      const draw = drawer.draw();
      const stream = draw.createPNGStream();
      const filePath = _path.default.resolve(__dirname, '../../../res/outPut.png');
      const out = _fs.default.createWriteStream(filePath, { flags: 'w' });
      stream.pipe(out);
      out.on('finish', () => {
        console.log('write file to:');
        console.log(filePath);
      });
      // return draw.toBuffer('image/jpeg').toString('base64');
    })();}}var _default =


new HoShiiService();exports.default = _default;