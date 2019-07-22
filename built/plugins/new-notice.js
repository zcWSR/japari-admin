"use strict";require("core-js/modules/es.array.slice");require("core-js/modules/es.promise");require("core-js/modules/es.string.replace");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _db = require("../decorators/db");
var _plugin = require("../decorators/plugin");
var _qqService = _interopRequireDefault(require("../services/qq-service"));
var _logger = _interopRequireDefault(require("../utils/logger"));var _dec, _class, _class2;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {var desc = {};Object.keys(descriptor).forEach(function (key) {desc[key] = descriptor[key];});desc.enumerable = !!desc.enumerable;desc.configurable = !!desc.configurable;if ('value' in desc || desc.initializer) {desc.writable = true;}desc = decorators.slice().reverse().reduce(function (desc, decorator) {return decorator(target, property, desc) || desc;}, desc);if (context && desc.initializer !== void 0) {desc.value = desc.initializer ? desc.initializer.call(context) : void 0;desc.initializer = undefined;}if (desc.initializer === void 0) {Object.defineProperty(target, property, desc);desc = null;}return desc;}

const defaultMsg = name => `欢迎 ${name} 加入本群! 请使用"!help"查看可用指令~`;let









NewNotice = (_dec = (0, _plugin.Plugin)({ name: 'new-notice', weight: 99, type: 'notice', default: true, shortInfo: '入群提醒', info: '入群提醒' }), _dec(_class = (_class2 = class NewNotice {
  go(body) {var _this = this;return _asyncToGenerator(function* () {const
      event = body.event,groupId = body.gourp_id,userId = body.user_id;
      if (event !== 'group_increase') return 'break';
      _logger.default.info(`群 ${groupId} 有新成员 ${userId} 加入, 正在查询昵称...`);
      const memberName = yield _qqService.default.getGroupMemberName(groupId, userId);
      if (!memberName) return 'break';
      const template = yield _this.getTemplate(groupId);
      let msg;
      if (template) {
        msg = _this.convertMsg(template, memberName);
      } else {
        msg = defaultMsg(memberName);
      }
      _logger.default.info(`向${userId}: ${memberName}, 发送欢迎入群消息: ${msg}`);
      _qqService.default.sendGroupMessage(groupId, msg);
      return true;})();
  }

  convertMsg(msg, memberName) {
    // eslint-disable-next-line no-template-curly-in-string
    return msg.replace('${name}', memberName);
  }


  createTable(trx) {return _asyncToGenerator(function* () {
      if (!(yield trx.schema.hasTable('new-notice'))) {
        yield trx.schema.createTable('new-notice', table => {
          table.bigInteger('group_id').primary();
          table.string('template');
        });
      }})();
  }


  getTemplate(trx, groupId) {return _asyncToGenerator(function* () {
      const result = yield trx('new-notice').
      first().
      select('template').
      where('group_id', groupId);
      return (result || {}).template;})();
  }}, (_applyDecoratedDescriptor(_class2.prototype, "createTable", [_db.withTransaction], Object.getOwnPropertyDescriptor(_class2.prototype, "createTable"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getTemplate", [_db.withTransaction], Object.getOwnPropertyDescriptor(_class2.prototype, "getTemplate"), _class2.prototype)), _class2)) || _class);var _default =


NewNotice;exports.default = _default;
//# sourceMappingURL=new-notice.js.map
