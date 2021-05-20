"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;

var _uuid = require("uuid");
var _imageDrawer = _interopRequireDefault(require("./image-drawer"));
var _firebaseService = _interopRequireDefault(require("../firebase-service"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}

class HoShiiService {
  drawImage(topText, bottomText) {
    const drawer = new _imageDrawer.default(topText, bottomText);
    const draw = drawer.draw();
    return draw.toBuffer('image/png');
    // const stream = draw.createPNGStream();
    // const filePath = path.resolve(__dirname, '../../../res/outPut.png');
    // const out = fs.createWriteStream(filePath, { flags: 'w' });
    // stream.pipe(out);
    // out.on('finish', () => {
    //   console.log('write file to:');
    //   console.log(filePath);
    // });
    // return draw.toBuffer('image/png').toString('base64');
  }

  drawAndGetRemoteUrl(topText, bottomText, fileName) {var _this = this;return _asyncToGenerator(function* () {
      const imageBuffer = _this.drawImage(topText, bottomText);
      const filePath = `hoshii/${fileName}.png`;
      const file = _firebaseService.default.bucket.file(filePath);
      const fileDownloadToken = (0, _uuid.v4)();
      yield file.save(imageBuffer, {
        metadata: {
          contentType: 'image/png',
          cacheControl: 'max-age=31536000',
          metadata: {
            firebaseStorageDownloadTokens: fileDownloadToken } } });



      // file.makePublic()
      return `https://firebasestorage.googleapis.com/v0/b/${
      _firebaseService.default.bucketUrl
      }/o/${encodeURIComponent(filePath)}?alt=media&token=${fileDownloadToken}`;})();
  }}var _default =


new HoShiiService();exports.default = _default;