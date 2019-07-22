"use strict";require("core-js/modules/es.array.filter");require("core-js/modules/es.array.index-of");require("core-js/modules/es.array.iterator");require("core-js/modules/es.object.get-own-property-descriptors");require("core-js/modules/es.promise");Object.defineProperty(exports, "__esModule", { value: true });exports.Command = exports.Block = exports.Plugin = void 0;var _config = _interopRequireDefault(require("../config"));
var _logger = _interopRequireDefault(require("../utils/logger"));
var _qqService = _interopRequireDefault(require("../services/qq-service"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {var symbols = Object.getOwnPropertySymbols(object);if (enumerableOnly) symbols = symbols.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});keys.push.apply(keys, symbols);}return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i] != null ? arguments[i] : {};if (i % 2) {ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

const Plugin = config => {
  const defaultConfig = {
    name: '', // 插件名, 只可为英文名
    weight: 0, // 权重
    type: 'group', //  所属消息类别
    shortInfo: '', // 短描述
    info: '', // 插件描述
    default: false, // 默认加载, 可被群配置覆盖,
    hide: false, // 是否在
    mute: false // 不打印命中log
  };

  if (typeof config === 'string') {
    config = _objectSpread({}, defaultConfig, { name: config });
  } else if (typeof config === 'object') {
    config = _objectSpread({}, defaultConfig, {}, config);
  }
  return target => class extends target {
    constructor() {
      super();
      Object.keys(config).forEach(configName => {
        this[configName] = config[configName];
      });
    }

    go(body, plugins) {
      this.mute || _logger.default.info(`plugin ${this.name} triggered`);
      return target.prototype.go.call(this, body, plugins);
    }

    setDBInstance(instance) {
      this.DBInstance = instance;
    }};

};exports.Plugin = Plugin;

const Block = (target, name, descriptor) => {
  const fn = descriptor.value;
  // eslint-disable-next-line space-before-function-paren
  descriptor.value = /*#__PURE__*/function () {var _value = _asyncToGenerator(function* (...args) {
      return (yield fn.call(this, ...args)) || true;
    });function value() {return _value.apply(this, arguments);}return value;}();
  return descriptor;
};exports.Block = Block;

const Command = config => {
  const defaultConfig = {
    name: '', // 指令中文简称
    command: '', // 指令英文名, 调用时使用
    type: 'all', // 指令类型, all group private
    info: '描述', // 指令详细描述
    default: false, // 是否默认开启
    mute: false, // 不打印命中log
    level: 1, // 权限级别, 1 普通, 2 管理员, 3 总管理,
    permissionDeniedNotice: '权限不足' // 权限不足提醒文案
    // groupPermissionDeniedNotice: '', // 群权限不足提醒文案,
    // privatePermissionDeniedNotice: '' // 私聊权限不足提醒文案
  };

  if (typeof config === 'string') {
    config = _objectSpread({}, defaultConfig, { name: config, command: config });
  } else if (typeof config === 'object') {
    config = _objectSpread({}, defaultConfig, {}, config);
  }
  if (config.type === 'private' && config.level < 3) {
    config.level = 1;
  }
  return target => class extends target {
    constructor() {
      super();
      Object.keys(config).forEach(configName => {
        this[configName] = config[configName];
      });
    }

    sendNoPermissionMsg({ group_id: groupId, user_id: userId }, type) {
      if (type === 'group') {
        _qqService.default.sendGroupMessage(groupId, this.permissionDeniedNotice);
        return;
      }
      if (type === 'private') {
        _qqService.default.sendPrivateMessage(userId, this.permissionDeniedNotice);
      }
    }

    trigger(params, body, type, commandMap) {var _this = this;return _asyncToGenerator(function* () {
        _this.mute || _logger.default.info(`command '!${_this.command}' triggered, params: ${params}`);
        if (_this.level === 3) {
          if (_config.default.ADMINS.indexOf(+body.user_id) === -1) {
            _this.sendNoPermissionMsg(body, type);
            return;
          }
        } else if (_this.level === 2) {
          // 只有群聊模式才会出现level=2
          const userRole = yield _qqService.default.getGroupUserRole(body.group_id, body.user_id);
          if (!(userRole === 'owner' || userRole === 'admin')) {
            _qqService.default.sendGroupMessage(body.group_id, _this.permissionDeniedNotice);
            return;
          }
        }
        return target.prototype.run.call(_this, params, body, type, commandMap);})();
    }

    setDBInstance(instance) {
      this.DBInstance = instance;
    }};

};exports.Command = Command;
//# sourceMappingURL=plugin.js.map
