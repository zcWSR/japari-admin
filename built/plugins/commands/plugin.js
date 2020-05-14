"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _plugin = require("../../decorators/plugin");
var _pluginService = _interopRequireDefault(require("../../services/plugin-service"));
var _qqService = _interopRequireDefault(require("../../services/qq-service"));var _dec, _class;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {var symbols = Object.getOwnPropertySymbols(object);if (enumerableOnly) symbols = symbols.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});keys.push.apply(keys, symbols);}return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i] != null ? arguments[i] : {};if (i % 2) {ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}let










PluginConfig = (_dec = (0, _plugin.Command)({ name: '插件配置', command: 'plugin', type: 'group', info: "用来配置插件开启状态, '!plugin' 来查看开启状态, '!plugin x x' 来切换开启/关闭状态, x为插件编号, 用空格分割", default: true, level: 2 }), _dec(_class = class PluginConfig {
  getAllPlugins() {const _PluginService$plugin =
    _pluginService.default.plugins,group = _PluginService$plugin.group,notice = _PluginService$plugin.notice;
    return [...group, ...notice];
  }

  run(params, body) {var _this = this;return _asyncToGenerator(function* () {const
      groupId = body.group_id;
      const isAdmin = _qqService.default.isSuperAdmin(body.user_id);
      const allPluginList = _this.getAllPlugins();
      const configMap = yield _pluginService.default.getGroupConfig(groupId);
      if (!params) {
        let content = allPluginList.reduce((result, current, index) => {
          const hasThisPlugin = configMap[current.name];
          if (current.hide && !isAdmin) {
            return result;
          }
          result += `${index + 1}. ${current.shortInfo}${hasThisPlugin ? '(开启中)' : '(关闭)'}\n`;
          return result;
        }, '插件开启状态:\n');
        content = content.slice(0, content.length - 1);
        _qqService.default.sendGroupMessage(groupId, content);
        return;
      }
      if (params.replace(/\d/g, '').trim()) {
        _qqService.default.sendGroupMessage(groupId, '非法参数');
      }
      const toggleIndexes = params.trim().split(' ');
      const configMapClone = _objectSpread({}, configMap);
      let alertMsg = '';
      const modifiedPlugin = { name: '', isON: false };
      allPluginList.every((plugin, index) => {
        const currentIndex = index + 1;
        if (toggleIndexes.indexOf(`${currentIndex}`) === -1) {
          return true;
        }
        if (!isAdmin && plugin.hide) {
          alertMsg = `别试了, ${currentIndex} 你没权限操作`;
          return false;
        }
        const hasThisPlugin = configMapClone[plugin.name];
        modifiedPlugin.name = plugin.shortInfo;
        modifiedPlugin.isON = !hasThisPlugin;
        if (hasThisPlugin) {
          delete configMapClone[plugin.name];
        } else {
          configMapClone[plugin.name] = true;
        }
        return true;
      });
      if (alertMsg) {
        _qqService.default.sendGroupMessage(groupId, alertMsg);
        return;
      }
      yield _pluginService.default.setGroupConfig(groupId, configMapClone);
      yield _qqService.default.sendGroupMessage(
      groupId,
      `'${modifiedPlugin.name}'已${modifiedPlugin.isON ? '开启' : '关闭'}`);})();

  }}) || _class);var _default =


PluginConfig;exports.default = _default;