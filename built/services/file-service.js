"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _fs = require("fs");
var _path = require("path");

var _logger = _interopRequireDefault(require("../utils/logger"));
var _stringUtils = require("../utils/string-utils");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

class FileService {
  /**
                    * @param {string} path
                    * @returns {[{path: string, name: string}]}
                    */
  getDirFiles(path) {
    return (0, _fs.readdirSync)(path).reduce((prev, name) => {
      const fullPath = (0, _path.resolve)(path, name);
      if ((0, _fs.statSync)(fullPath).isFile() && fullPath.slice(-2) === 'js') {
        prev.push({
          name,
          path: fullPath });

      }
      return prev;
    }, []);
  }

  getRoutersFromDir(path, app) {
    _logger.default.info(`load routes from dir '${path}'`);
    return this.getDirFiles(path).reduce((result, { path: filePath, name: fileName }) => {
      // eslint-disable-next-line
      const Controller = (require(filePath) || {}).default;
      if (!Controller) {
        _logger.default.warn(`file '${filePath}' export nothing, skip`);
        return result;
      }
      let prefix = (0, _stringUtils.toDash)(fileName.replace(/-?controller\.js/i, ''));
      if (!prefix || prefix === 'main') {
        prefix = '/';
      } else {
        prefix = `/${prefix}`;
      }
      const routes = new Controller(prefix).mount();
      if (app) {
        app.use(routes);
      }
      result.push(routes);
      return result;
    }, []);
  }}var _default =


new FileService();exports.default = _default;