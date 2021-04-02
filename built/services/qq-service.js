"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _axios = _interopRequireDefault(require("axios"));
var _momentTimezone = _interopRequireDefault(require("moment-timezone"));
var _logger = _interopRequireDefault(require("../utils/logger"));
var _config = _interopRequireDefault(require("../config"));
var _env = require("../utils/env");
var _process = require("../utils/process");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}

class QQService {
  constructor() {this.






















































































































































    authCheckFuncMap = {
      owner: this.isGroupOwner,
      admin: this.isGroupAdminOrOwner };if ((0, _env.isDev)()) {this.sendGroupMessage = (groupId, msg) => {_logger.default.debug(`===== send to group ${groupId}`);if (msg.split) {msg.split('\n').forEach(line => _logger.default.debug(line));} else {_logger.default.debug(msg);}_logger.default.debug('===== done');};this.sendPrivateMessage = (userId, msg) => {_logger.default.debug(`===== send to user ${userId}`);if (msg.split) {msg.split('\n').forEach(line => _logger.default.debug(line));} else {_logger.default.debug(msg);}_logger.default.debug('===== done');};}}getGroupList() {return _asyncToGenerator(function* () {const list = yield _axios.default.post(`${_config.default.QQ_SERVER}/get_group_list`);return list;})();}isSuperAdmin(userId) {return _config.default.ADMINS.includes(+userId);} // 是否为群主
  isGroupOwner(groupId, userId) {var _this = this;return _asyncToGenerator(function* () {return (yield _this.getGroupUserRole(groupId, userId)) === 'owner';})();} // 是否为管理人员
  isGroupAdminOrOwner(groupId, userId) {var _this2 = this;return _asyncToGenerator(function* () {const roll = yield _this2.getGroupUserRole(groupId, userId);return roll === 'admin' || roll === 'owner';})();}getGroupUserRole(groupId, userId) {return _asyncToGenerator(function* () {try {const meta = yield _axios.default.post(`${_config.default.QQ_SERVER}/get_group_member_info`, { group_id: groupId, user_id: userId });const memberInfo = meta.data.data;if (!memberInfo) return null;if (!memberInfo.user_id) return null;return memberInfo.role;} catch (e) {_logger.default.error(`get group(${groupId}) user(${userId}) role error`);_logger.default.error(e);return null;}})();}getGroupUserName(groupId, userId) {return _asyncToGenerator(function* () {try {const meta = yield _axios.default.post(`${_config.default.QQ_SERVER}/get_group_member_info`, { group_id: groupId, user_id: userId });const memberInfo = meta.data.data;if (!memberInfo) return null;return memberInfo.nickname;} catch (e) {_logger.default.error(`get group(${groupId}) user(${userId}) name error`);_logger.default.error(e);return null;}})();}sendPrivateMessage(userId, message) {_axios.default.post(`${_config.default.QQ_SERVER}/send_private_msg`, { user_id: userId, message });}sendPrivateMusic(userId, musicId) {this.sendPrivateMessage(userId, [{ type: 'music', data: { type: '163', id: `${musicId}` } }]);}sendGroupMessage(groupId, message) {_axios.default.post(`${_config.default.QQ_SERVER}/send_group_msg`, { group_id: groupId, message });}sendGroupImage(groupId, dataUrl) {this.sendGroupMessage(groupId, [{ type: 'image', data: { file: `base64://${dataUrl}` } }]);}sendGroupMusic(groupId, musicId) {this.sendGroupMessage(groupId, [{ type: 'music', data: { type: '163', id: `${musicId}` } }]);}banGroupUser(groupId, userId, duration) {_axios.default.post(`${_config.default.QQ_SERVER}/set_group_ban`, { group_id: groupId, user_id: userId, duration });} /**
   * 将接收到的postType转换成插件对应的postType
   * @param {{ post_type, messag_type }} 上报事件
   * @return {string} 事件类型
   */convertMessageType(event) {if (event.post_type === 'message') {return event.message_type;}return event.post_type;}sendReadyMessage() {var _this3 = this;return _asyncToGenerator(function* () {const message = `服务(重)启动于: ${(0, _momentTimezone.default)().tz('Asia/Shanghai').format('YYYY年MM月DD日 HH:mm:ss')}`;_logger.default.info(message);yield _config.default.ADMINS.map( /*#__PURE__*/function () {var _ref = _asyncToGenerator(function* (admin, index) {yield _this3.sendPrivateMessage(admin, message);yield (0, _process.sleep)();return index;});return function (_x, _x2) {return _ref.apply(this, arguments);};}());})();}checkRateWithMessage(rate, groupId, userId,
  min = 0,
  max = 1,
  rateNeedAuth = 0.5,
  authLevel = 'owner')
  {var _this4 = this;return _asyncToGenerator(function* () {
      if (Number.isNaN(rate)) {
        _this4.sendGroupMessage(groupId, '参数非法');
        return false;
      }
      if (rate < min) {
        _this4.sendGroupMessage(groupId, `不可设置小于${(min * 100).toFixed(0)}%的值`);
        return false;
      }
      if (rate > max) {
        _this4.sendGroupMessage(groupId, `不可设置大于${(max * 100).toFixed(0)}%的值`);
        return false;
      }
      if (rateNeedAuth && rate > rateNeedAuth) {
        if (yield _this4.authCheckFuncMap[authLevel].call(_this4, groupId, userId)) {
          return true;
        }
        const level = authLevel === 'auth' ? '管理员及以上' : '群主';
        _this4.sendGroupMessage(
        groupId,
        `设置概率为${(rateNeedAuth * 100).toFixed(0)}%及以上仅${level}有权限`);

        return false;
      }
      return true;})();
  }}var _default =


new QQService();exports.default = _default;