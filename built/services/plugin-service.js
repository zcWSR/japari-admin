"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _path = _interopRequireDefault(require("path"));
var _fileService = _interopRequireDefault(require("./file-service"));
var _redisService = _interopRequireDefault(require("./redis-service"));

var _logger = _interopRequireDefault(require("../utils/logger"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}

class PluginService {constructor() {this.
    plugins = {
      group: [],
      private: [],
      notice: [] };this.


    groupConfigs = {};this.
    defaultGroupConfig = [];this.
    privateConfigs = [];}

  sortByWeight(pluginA, pluginB) {
    return pluginB.weight - pluginA.weight;
  }

  classifyPlugin(plugin) {
    if (plugin.type === 'message' || plugin.type === 'private') {
      _logger.default.debug(`category is '${plugin.type}', load into private plugin list`);
      this.plugins.private.push(plugin);
      this.plugins.private.sort(this.sortByWeight);
    }
    if (plugin.type === 'message' || plugin.type === 'group') {
      _logger.default.debug(`category is '${plugin.type}', load into group plugin list`);
      this.plugins.group.push(plugin);
      this.plugins.group.sort(this.sortByWeight);
    }
    if (plugin.type === 'notice') {
      _logger.default.debug("category is 'notice', load into notice plugin list");
      this.plugins.notice.push(plugin);
      this.plugins.notice.some(this.sortByWeight);
    }
  }

  // 废弃, 改为惰性加载
  // async loadGroupPluginConfig() {
  //   const configArray = (await DBService.getAllGroupPluginConfig()) || [];
  //   this.groupConfigs = configArray.reduce(
  //     (groupMap, { groupId, pluginList: pluginNameString }) => {
  //       const nameList = pluginNameString.split(' ');
  //       console.log(nameList);
  //       groupMap[groupId] = nameList.reduce((configMap, name) => {
  //         configMap[name] = true;
  //         return configMap;
  //       }, {});
  //       return groupMap;
  //     },
  //     {}
  //   );
  // }

  loadPrivatePluginConfig() {var _this = this;return _asyncToGenerator(function* () {
      // 暂时搞成加载全部, 后期改成可配置
      // TODO 可在config.js 配置是否加载某插件
      const nameList = _this.plugins.private.map(plugin => plugin.name);
      nameList.forEach(name => {
        _this.privateConfigs[name] = true;
      });})();
  }

  loadPlugins(db) {var _this2 = this;return _asyncToGenerator(function* () {
      _logger.default.info('======== start load plugin ========');
      // eslint-disable-next-line no-restricted-syntax
      var _iteratorNormalCompletion = true;var _didIteratorError = false;var _iteratorError = undefined;try {for (var _iterator = _fileService.default.getDirFiles(_path.default.resolve(__dirname, '../plugins'))[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {const file = _step.value;
          // eslint-disable-next-line import/no-dynamic-require, global-require
          const required = require(file.path);
          if (!required || !required.default) {
            _logger.default.warn('wrong plugin constructor!!!!!, skip');
            _logger.default.warn(`check file at: ${file.path}`);
            continue;
          }
          const Plugin = required.default;
          const plugin = new Plugin();
          if (!plugin.name) throw new Error('plugin require a name');
          // if (result[plugin.name]) {
          //   logger.warn(`detect same name plugin '${plugin.name}', overwrite it`);
          // }
          plugin.setDBInstance(db);
          if (plugin.createTable) {
            _logger.default.debug('create required database');
            yield plugin.createTable();
          }
          if (plugin.init) {
            _logger.default.debug('init plugin');
            yield plugin.init();
          }
          _this2.classifyPlugin(plugin);
          _logger.default.info(`load plugin '${plugin.name}' complete`);
        }} catch (err) {_didIteratorError = true;_iteratorError = err;} finally {try {if (!_iteratorNormalCompletion && _iterator.return != null) {_iterator.return();}} finally {if (_didIteratorError) {throw _iteratorError;}}}
      _this2.defaultGroupConfig = _this2.plugins.group.reduce((prev, curr) => {
        if (curr.default) {
          prev.push(curr.name);
        }
        return prev;
      }, []);
      _logger.default.info('======== all plugin loaded ========');
      _logger.default.info('load private plugin config');
      yield _this2.loadPrivatePluginConfig();})();
  }

  /**
     * 获取对应postType的所有插件列表
     * @param { string } postType 上报事件类型
     * @return {[Plugin]} 插件列表
     */
  getPlugins(postType) {
    return this.plugins[postType] || [];
  }

  /**
     * 根据groupId 获取群插件列表
     * @param {number} groupId 群id
     * @returns {{ [object]: true }} Map 结构的插件列表
     */
  getGroupConfig(groupId) {var _this3 = this;return _asyncToGenerator(function* () {
      if (_this3.groupConfigs[groupId]) {
        return _this3.groupConfigs[groupId];
      }
      let config = null;
      try {
        _logger.default.info(`did not find local group(${groupId}) config cache, getting from redis...`);
        config = yield _redisService.default.getGroupPluginConfig(groupId);
        if (!Array.isArray(config) || !config.length) {
          _logger.default.info('config not found, use default');
          config = _this3.defaultGroupConfig;
        } else {
          _logger.default.info(`got config, ${JSON.stringify(config)}`);
        }
      } catch (e) {
        _logger.default.error('get from redis error');
        _logger.default.error(e);
        config = _this3.defaultGroupConfig;
      }
      _logger.default.info('saving to cache...');
      _this3.groupConfigs[groupId] = config.reduce((prev, curr) => {
        prev[curr] = true;
        return prev;
      }, {});
      yield _redisService.default.updateGroupPluginConfig(groupId, config);
      return _this3.groupConfigs[groupId];})();
  }

  /**
     * 根绝groupId 设置群插件列表
     * @param {number} groupId 群id
     * @param {{ [object]: true }} groupConfigMap Map 结构插件列表
     */
  setGroupConfig(groupId, groupConfigMap) {var _this4 = this;return _asyncToGenerator(function* () {
      _this4.groupConfigs[groupId] = groupConfigMap;
      const groupConfigList = Object.keys(groupConfigMap);
      yield _redisService.default.updateGroupPluginConfig(groupId, groupConfigList);})();
  }

  /**
     * 获取配置组
     * @param {string} type 组名
     * @param {{ group_id: string }} event 上报事件内容
     * @returns {{}} 配置组
     */
  getConfig(type, { group_id: groupId }) {
    switch (type) {
      case 'notice':
        return groupId ? this.getGroupConfig(groupId) : this.privateConfigs;
      case 'group':
        return this.getGroupConfig(groupId);
      case 'private':
        return this.privateConfigs;
      default:
        return null;}

  }}var _default =


new PluginService();exports.default = _default;