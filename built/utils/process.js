"use strict";require("core-js/modules/es.symbol.description");require("core-js/modules/es.array.iterator");require("core-js/modules/es.array.slice");require("core-js/modules/es.string.match");Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.getProcessArgv = void 0;function _slicedToArray(arr, i) {return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();}function _nonIterableRest() {throw new TypeError("Invalid attempt to destructure non-iterable instance");}function _iterableToArrayLimit(arr, i) {var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i["return"] != null) _i["return"]();} finally {if (_d) throw _e;}}return _arr;}function _arrayWithHoles(arr) {if (Array.isArray(arr)) return arr;}const getProcessArgv = () => {const _process =
  process,argv = _process.argv;
  if (argv.length <= 2) return {};
  let argvClone = [...argv];
  argvClone = argvClone.slice(2);
  return argvClone.reduce((prev, curr) => {
    const keyMatch = curr.match(/^-+(\w+)=?(.*)$/);
    if (!keyMatch) return prev;const _keyMatch = _slicedToArray(
    keyMatch, 3),key = _keyMatch[1],value = _keyMatch[2];
    prev[key] = value || true;
    return prev;
  }, {});
};exports.getProcessArgv = getProcessArgv;var _default =

getProcessArgv;exports.default = _default;