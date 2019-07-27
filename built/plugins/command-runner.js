"use strict";require("core-js/modules/es.symbol.description");require("core-js/modules/es.array.iterator");require("core-js/modules/es.array.slice");require("core-js/modules/es.promise");require("core-js/modules/es.string.match");require("core-js/modules/es.string.trim");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _path = _interopRequireDefault(require("path"));
var _logger = _interopRequireWildcard(require("../utils/logger"));
var _fileService = _interopRequireDefault(require("../services/file-service"));
var _db = require("../decorators/db");
var _plugin = require("../decorators/plugin");
var _qqService = _interopRequireDefault(require("../services/qq-service"));var _dec, _class, _class2, _temp;function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _slicedToArray(arr, i) {return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();}function _nonIterableRest() {throw new TypeError("Invalid attempt to destructure non-iterable instance");}function _iterableToArrayLimit(arr, i) {var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i["return"] != null) _i["return"]();} finally {if (_d) throw _e;}}return _arr;}function _arrayWithHoles(arr) {if (Array.isArray(arr)) return arr;}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {var desc = {};Object.keys(descriptor).forEach(function (key) {desc[key] = descriptor[key];});desc.enumerable = !!desc.enumerable;desc.configurable = !!desc.configurable;if ('value' in desc || desc.initializer) {desc.writable = true;}desc = decorators.slice().reverse().reduce(function (desc, decorator) {return decorator(target, property, desc) || desc;}, desc);if (context && desc.initializer !== void 0) {desc.value = desc.initializer ? desc.initializer.call(context) : void 0;desc.initializer = undefined;}if (desc.initializer === void 0) {Object.defineProperty(target, property, desc);desc = null;}return desc;}

const COMMAND_404 = "您所调用的指令不存在尝试使用, '!help'来查看所有可用指令";let











CommandRunner = (_dec = (0, _plugin.Plugin)({ name: 'command-runner', weight: 99, type: 'message', shortInfo: '指令响应', info: "响应群聊/私聊指令, 指令'!'或'！'开头", default: true, hide: true, mute: true }), _dec(_class = (_class2 = (_temp = class CommandRunner {constructor() {this.
    command = {
      private: {},
      group: {} };}


  /**
                     * 指令分类
                     * @param {any} command 指令对象
                     */
  classifyCommand(command) {
    if (command.type === 'all' || command.type === 'private') {
      _logger.default.debug(`type is '${command.type}', load into private command list`);
      this.command.private[command.command] = command;
    }
    if (command.type === 'all' || command.type === 'group') {
      _logger.default.debug(`type is '${command.type}', load into group command list`);
      this.command.group[command.command] = command;
    }
  }

  init() {var _this = this;return _asyncToGenerator(function* () {
      (0, _logger.blockLog)(['CommandRunner', 'v1.0'], 'info', '@', 0, 10);
      _logger.default.info('======== start load command  ========');
      // eslint-disable-next-line no-restricted-syntax
      var _iteratorNormalCompletion = true;var _didIteratorError = false;var _iteratorError = undefined;try {for (var _iterator = _fileService.default.getDirFiles(_path.default.resolve(__dirname, 'commands'))[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {const file = _step.value;
          // eslint-disable-next-line import/no-dynamic-require, global-require
          const required = require(file.path);
          if (!required || !required.default) {
            _logger.default.warn('wrong command constructor!!!!!, skip');
            _logger.default.warn(`check file at: ${file.path}`);
            continue;
          }
          const Command = required.default;
          const command = new Command();
          if (!command.name) throw Error('command require a name');
          command.setDBInstance(_this.DBInstance);
          if (command.createTable) {
            _logger.default.debug('create command require database');
            yield command.createTable();
          }
          if (command.init) {
            _logger.default.debug('init command');
            yield command.init();
          }
          _this.classifyCommand(command);
          _logger.default.info(`load command '${command.command}' complete`);
        }} catch (err) {_didIteratorError = true;_iteratorError = err;} finally {try {if (!_iteratorNormalCompletion && _iterator.return != null) {_iterator.return();}} finally {if (_didIteratorError) {throw _iteratorError;}}}
      _logger.default.info('======== all command loaded  ========');})();
  }

  /**
     * 判断是否为指令调用内容, 返回指令和参数
     * @param {string} content 完整内容
     */
  isCommand(content) {
    let match = content.match(/^[!|\uff01]([a-zA-Z]{2,})\s(.*)$/);
    if (match) {const _match =
      match,_match2 = _slicedToArray(_match, 3),name = _match2[1],params = _match2[2];
      return { name, params: params.trim() };
    }
    // 对无参数指令做分别处理, 防止出现!recent1 类似这样不加空格也能匹配成功的问题
    match = content.match(/^[!|\uff01]([a-zA-Z]{2,})$/);
    if (!match) return null;
    return {
      name: match[1],
      params: '' };

  }

  groupCommand(body, command, type) {
    const commandInstance = this.command.group[command.name];
    if (!commandInstance) {
      _qqService.default.sendGroupMessage(body.group_id, COMMAND_404);
      return;
    }
    commandInstance.trigger(command.params, body, type, this.command.group);
  }

  privateCommand(body, command, type) {
    const commandInstance = this.command.private[command.name];
    if (!commandInstance) {
      _qqService.default.sendPrivateMessage(body.user_id, COMMAND_404);
      return;
    }
    commandInstance.trigger(command.params, body, type, this.command.private);
  }

  go(body, type) {var _this2 = this;return _asyncToGenerator(function* () {const
      message = body.message;
      const c = _this2.isCommand(message);
      if (!c) return; // 不是指令, 直接跳过流程
      switch (type) {
        case 'group':
          yield _this2.groupCommand(body, c, type);
          break;
        case 'private':
          yield _this2.privateCommand(body, c, type);
          break;
        default:}

      return 'break';})();
  }


  createTable(trx) {return _asyncToGenerator(function* () {
      if (!(yield trx.schema.hasTable('group_command_list'))) {
        yield trx.schema.createTable('group_command_list', table => {
          table.bigInteger('group_id').primary();
          table.string('command_list');
        });
      }})();
  }}, _temp), (_applyDecoratedDescriptor(_class2.prototype, "createTable", [_db.withTransaction], Object.getOwnPropertyDescriptor(_class2.prototype, "createTable"), _class2.prototype)), _class2)) || _class);var _default =


CommandRunner;exports.default = _default;