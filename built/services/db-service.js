"use strict";require("core-js/modules/es.array.iterator");require("core-js/modules/es.array.slice");require("core-js/modules/es.promise");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _knex = _interopRequireDefault(require("knex"));
var _env = require("../utils/env");
var _config = _interopRequireDefault(require("../config"));
var _logger = _interopRequireDefault(require("../utils/logger"));
var _db = require("../decorators/db");var _dec, _dec2, _dec3, _dec4, _class;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {var desc = {};Object.keys(descriptor).forEach(function (key) {desc[key] = descriptor[key];});desc.enumerable = !!desc.enumerable;desc.configurable = !!desc.configurable;if ('value' in desc || desc.initializer) {desc.writable = true;}desc = decorators.slice().reverse().reduce(function (desc, decorator) {return decorator(target, property, desc) || desc;}, desc);if (context && desc.initializer !== void 0) {desc.value = desc.initializer ? desc.initializer.call(context) : void 0;desc.initializer = undefined;}if (desc.initializer === void 0) {Object.defineProperty(target, property, desc);desc = null;}return desc;}let

DBService = (_dec =



















(0, _db.createWithLog)('group_config'), _dec2 =






(0, _db.createWithLog)('osu_bind'), _dec3 =










(0, _db.createWithLog)('osu_map'), _dec4 =






(0, _db.createWithLog)('plugin_group_config'), (_class = class DBService {constructor() {this.DBInstance = (0, _knex.default)({ // client: 'mysql',
      // connection: {
      //   host: Config.DB.DB_HOST,
      //   user: Config.DB.DB_USER,
      //   password: Config.DB.DB_PW,
      //   database: Config.DB.DB_SCHAME
      // },
      client: 'sqlite3', connection: { filename: _config.default.DB.filePath }, debug: (0, _env.isDev)(), useNullAsDefault: true });} // qq群配置信息
  createGroupConfigTable(table) {table.bigInteger('group_id').primary();table.string('config');} // osu 用户数据绑定
  createOSUBindTable(table) {table.increments('id').primary();table.bigInteger('user_id');table.bigInteger('group_id');table.bigInteger('osu_id');table.string('osu_name');table.integer('mode');} // osu 地图信息
  createOSUMapTable(table) {table.bigInteger('id').primary();table.text('map');} // 群插件配置信息
  createPluginGroupConfigTable(table) {table.bigInteger('group_id').primary();table.string('plugin_list');} // // 指令插件群可用指令配置
  // @createWithLog('order_plugin_group_config')
  // createOrderPluginConfigTable(table) {
  //   table.bigInteger('group_id');
  //   table.text('order_list');
  // }
  checkTables() {var _this = this;return _asyncToGenerator(function* () {yield Promise.all([_this.createGroupConfigTable(), _this.createOSUBindTable(), _this.createOSUMapTable(),
      _this.createPluginGroupConfigTable()]);

      _logger.default.info('all table prepared');})();
  }

  isTableExist(name) {var _this2 = this;return _asyncToGenerator(function* () {
      const hasTable = yield _this2.DBInstance.schema.hasTable(name);
      return hasTable;})();
  }

  /**
     * 获取群通用配置
     * @param { knex } table
     */

  getGroupConfig(table, groupId) {return _asyncToGenerator(function* () {
      const result = yield table('group_config').
      first().
      select('config').
      where('group_id', groupId);
      return result ? JSON.parse(result.config) : null;})();
  }

  /**
     * 插入群通用配置
     * @param { knex } table
     */

  insertGroupConfig(table, groupId, config) {return _asyncToGenerator(function* () {
      yield table('group_config').
      insert({ group_id: groupId, config: JSON.stringify(config) }).
      where('group_id', groupId);})();
  }

  /**
     * 更新群通用配置
     * @param { knex } table
     */

  updateGroupConfig(table, groupId, config) {return _asyncToGenerator(function* () {
      yield table('group_config').
      update('config', JSON.stringify(config)).
      where('group_id', groupId);})();
  }

  // 群插件配置操作
  /**
   * 获取全部群插件配置
   * @param { knex } table
   */

  getAllGroupPluginConfig(table) {
    return table('plugin_group_config').select({
      groupId: 'group_id',
      pluginList: 'plugin_list' });

  }

  /**
     * 获取群插件配置
     * @param { knex } table
     */

  getGroupPluginConfig(table, groupId) {return _asyncToGenerator(function* () {
      const result = yield table('plugin_group_config').
      first().
      select({ pluginList: 'plugin_list' }).
      where('group_id', groupId);
      return (result || {}).pluginList;})();
  }

  /**
     * 插入群插件配置
     * @param { knex } table
     */

  insertGroupPluginConfig(table, groupId, pluginList) {
    const listString = pluginList.join(' ');
    return table('plugin_group_config').insert({
      group_id: groupId,
      plugin_list: listString });

  }

  /**
     * 更新群插件配置
     * @param { knex } table
     */

  updateGroupPluginConfig(table, groupId, pluginList) {
    const listString = pluginList.join(' ');
    return table('plugin_group_config').
    update('plugin_list', listString).
    where('group_id', groupId);
  }}, (_applyDecoratedDescriptor(_class.prototype, "createGroupConfigTable", [_dec], Object.getOwnPropertyDescriptor(_class.prototype, "createGroupConfigTable"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "createOSUBindTable", [_dec2], Object.getOwnPropertyDescriptor(_class.prototype, "createOSUBindTable"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "createOSUMapTable", [_dec3], Object.getOwnPropertyDescriptor(_class.prototype, "createOSUMapTable"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "createPluginGroupConfigTable", [_dec4], Object.getOwnPropertyDescriptor(_class.prototype, "createPluginGroupConfigTable"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "getGroupConfig", [_db.withTransaction], Object.getOwnPropertyDescriptor(_class.prototype, "getGroupConfig"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "insertGroupConfig", [_db.withTransaction], Object.getOwnPropertyDescriptor(_class.prototype, "insertGroupConfig"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "updateGroupConfig", [_db.withTransaction], Object.getOwnPropertyDescriptor(_class.prototype, "updateGroupConfig"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "getAllGroupPluginConfig", [_db.withTransaction], Object.getOwnPropertyDescriptor(_class.prototype, "getAllGroupPluginConfig"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "getGroupPluginConfig", [_db.withTransaction], Object.getOwnPropertyDescriptor(_class.prototype, "getGroupPluginConfig"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "insertGroupPluginConfig", [_db.withTransaction], Object.getOwnPropertyDescriptor(_class.prototype, "insertGroupPluginConfig"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "updateGroupPluginConfig", [_db.withTransaction], Object.getOwnPropertyDescriptor(_class.prototype, "updateGroupPluginConfig"), _class.prototype)), _class));var _default =


new DBService();exports.default = _default;