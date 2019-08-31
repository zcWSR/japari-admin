"use strict";require("core-js/modules/es.promise");var _path = require("path");
var _koa = _interopRequireDefault(require("koa"));
var _koaBody = _interopRequireDefault(require("koa-body"));
var _cfonts = _interopRequireDefault(require("cfonts"));

require("./config");
var _process = require("./utils/process");
var _errorCatcher = _interopRequireDefault(require("./middlewares/error-catcher"));
var _logger = _interopRequireDefault(require("./utils/logger"));
var _env = require("./utils/env");
var _redisService = _interopRequireDefault(require("./services/redis-service"));
var _dbService = _interopRequireDefault(require("./services/db-service"));
var _pluginService = _interopRequireDefault(require("./services/plugin-service"));
var _fileService = _interopRequireDefault(require("./services/file-service"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}

function initServer(port) {
  const app = new _koa.default();
  app.use((0, _koaBody.default)());
  app.use(_errorCatcher.default);
  _fileService.default.getRoutersFromDir((0, _path.resolve)(__dirname, 'controllers'), app);
  app.listen(port);
}

function getPort() {
  const args = (0, _process.getProcessArgv)();
  let port = 3000;
  if (!args.p && !args.port) {
    _logger.default.warn(`did not find port settings, use default port ${port}`);
  } else {
    port = +(args.p || args.port);
    _logger.default.info(`start at port ${port}`);
  }
  return port;
}function

start() {return _start.apply(this, arguments);}function _start() {_start = _asyncToGenerator(function* () {
    try {
      _cfonts.default.say('japari', {
        letterSpacing: 2,
        space: false,
        colors: ['yellow', 'green'] });

      _cfonts.default.say('admin', {
        letterSpacing: 2,
        space: false,
        colors: ['yellow', 'green'] });

      (0, _env.isDev)() && _logger.default.info('******** now in debug mode ********');
      yield _redisService.default.connect();
      yield _dbService.default.checkTables();
      yield _pluginService.default.loadPlugins(_dbService.default.DBInstance);
      initServer(getPort());
    } catch (e) {
      _logger.default.error(e);
      process.exit(1);
    }
  });return _start.apply(this, arguments);}

process.on('error', error => _logger.default.error(error));
start();