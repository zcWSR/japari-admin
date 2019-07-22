"use strict";require("core-js/modules/es.array.slice");require("core-js/modules/es.promise");require("core-js/modules/es.string.match");require("core-js/modules/es.string.trim");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _plugin = require("../../decorators/plugin");
var _db = require("../../decorators/db");
var _qqService = _interopRequireDefault(require("../../services/qq-service"));var _dec, _class, _class2;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {var desc = {};Object.keys(descriptor).forEach(function (key) {desc[key] = descriptor[key];});desc.enumerable = !!desc.enumerable;desc.configurable = !!desc.configurable;if ('value' in desc || desc.initializer) {desc.writable = true;}desc = decorators.slice().reverse().reduce(function (desc, decorator) {return decorator(target, property, desc) || desc;}, desc);if (context && desc.initializer !== void 0) {desc.value = desc.initializer ? desc.initializer.call(context) : void 0;desc.initializer = undefined;}if (desc.initializer === void 0) {Object.defineProperty(target, property, desc);desc = null;}return desc;}

// eslint-disable-next-line no-template-curly-in-string
const DEFAULT_TPL = '欢迎 ${name} 加入本群! 请使用"!help"查看可用指令~';let











NewNotice = (_dec = (0, _plugin.Command)({ name: '配置入群提醒模板', command: 'newNotice', type: 'group', info: // eslint-disable-next-line no-template-curly-in-string
  "查看当前或设置当前群的入群提醒模板, '!newNotice'来查看, '!newNotice set xxx'来设置, 模板中可使用'${name}'来代替入群人昵称", default: true, level: 2 }), _dec(_class = (_class2 = class NewNotice {getValue(params) {
    const match = params.match(/^(\w+)\s(.*)/);
    if (!match) {
      return {
        key: match,
        value: null };

    }
    return {
      key: match[1],
      value: match[2] };

  }


  getTemplate(trx, groupId) {return _asyncToGenerator(function* () {
      const result = yield trx('new-notice').
      first().
      select('template').
      where('group_id', groupId);
      return (result || {}).template;})();
  }


  setTemplate(trx, groupId, template) {return _asyncToGenerator(function* () {
      const exist = !!(yield trx('new-notice').
      where({ group_id: groupId }).
      first());
      if (exist) {
        yield trx('new-notice').
        update({ template }).
        where('group_id', groupId);
      } else {
        yield trx('new-notice').insert({ template, group_id: groupId });
      }})();
  }

  run(params, body) {var _this = this;return _asyncToGenerator(function* () {const
      groupId = body.group_id;
      params = params.trim();
      const template = yield _this.getTemplate(groupId);
      if (!params) {
        if (template) {
          _qqService.default.sendGroupMessage(groupId, `当前模板内容:\n'${template}'`);
        } else {
          _qqService.default.sendGroupMessage(groupId, `未设置自定义模板, 以下为默认模板:\n'${DEFAULT_TPL}'`);
        }
        return;
      }const _this$getValue =
      _this.getValue(params),key = _this$getValue.key,value = _this$getValue.value;
      if (key !== 'set') {
        _qqService.default.sendGroupMessage(groupId, `非法参数'${key || 'null'}'`);
        return;
      }
      if (!value) {
        _qqService.default.sendGroupMessage(groupId, '不可设置空模板');
        return;
      }
      yield _this.setTemplate(groupId, value);
      _qqService.default.sendGroupMessage(groupId, '设置成功!');})();
  }}, (_applyDecoratedDescriptor(_class2.prototype, "getTemplate", [_db.withTransaction], Object.getOwnPropertyDescriptor(_class2.prototype, "getTemplate"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "setTemplate", [_db.withTransaction], Object.getOwnPropertyDescriptor(_class2.prototype, "setTemplate"), _class2.prototype)), _class2)) || _class);var _default =


NewNotice;exports.default = _default;
//# sourceMappingURL=new-member-notice.js.map
