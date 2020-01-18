"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _akhrService = _interopRequireDefault(require("../../services/akhr-service"));
var _hrMeta = _interopRequireDefault(require("./hr-meta"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}

const ParsedResults = [
{
  TextOverlay: {
    Lines: [],
    HasOverlay: false,
    Message: 'Text overlay is not provided as it is not requested' },

  TextOrientation: '0',
  FileParseExitCode: 1,
  ParsedText: '辅助干员\r\n位移\r\n爆发\r\n支援机械\r\n支援\r\n',
  ErrorMessage: '',
  ErrorDetails: '' }];



_akhrService.default.AKHR_LIST = _akhrService.default.formatMetaData(_hrMeta.default);
const test = /*#__PURE__*/function () {var _ref = _asyncToGenerator(function* () {
    const words = (ParsedResults[0].ParsedText || '').
    replace(/\r\n$/, '').
    replace(/冫口了/g, '治疗').
    split('\r\n');
    const hrList = yield _akhrService.default.getAkhrList();
    const result = _akhrService.default.combine(words, hrList);
    console.log('result');
    console.log(JSON.stringify(result, null, 2));
    const msg = _akhrService.default.parseTextOutput(result);
    console.log('return');
    console.log(msg);
  });return function test() {return _ref.apply(this, arguments);};}();


// const test = () => {
//   const canvas = createCanvas(0, 0);
//   const ctx = canvas.getContext('2d');
//   const result = ctx.measureText('赵聪是个好学生');
//   console.log(result);
// };
var _default =
test;exports.default = _default;