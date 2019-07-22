"use strict";require("core-js/modules/es.promise");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _axios = _interopRequireDefault(require("axios"));
var _logger = _interopRequireDefault(require("../utils/logger"));
var _config = _interopRequireDefault(require("../config"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}

class QQService {
  getGroupList() {return _asyncToGenerator(function* () {
      const list = yield _axios.default.post(`${_config.default.QQ_SERVER}/get_group_list`);
      return list;})();
  }

  // 是否为群主
  isGroupOwner(groupId, userId) {var _this = this;return _asyncToGenerator(function* () {
      return (yield _this.getGroupUserRole(groupId, userId)) === 'owner';})();
  }

  // 是否为管理人员
  isGroupAdminOrOwner(groupId, userId) {var _this2 = this;return _asyncToGenerator(function* () {
      const roll = yield _this2.getGroupUserRole(groupId, userId);
      return roll === 'admin' || roll === 'owner';})();
  }

  getGroupUserRole(groupId, userId) {return _asyncToGenerator(function* () {
      try {
        const meta = yield _axios.default.post(`${_config.default.QQ_SERVER}/get_group_member_info`, {
          group_id: groupId,
          user_id: userId });

        const memberInfo = meta.data.data;
        if (!memberInfo) return null;
        if (!memberInfo.user_id) return null;
        return memberInfo.role;
      } catch (e) {
        _logger.default.error(`get group(${groupId}) user(${userId}) role error`);
        _logger.default.error(e);
        return null;
      }})();
  }

  getGroupUserName(groupId, userId) {return _asyncToGenerator(function* () {
      try {
        const meta = yield _axios.default.post(`${_config.default.QQ_SERVER}/get_group_member_info`, {
          group_id: groupId,
          user_id: userId });

        const memberInfo = meta.data.data;
        if (!memberInfo) return null;
        return memberInfo.nickname;
      } catch (e) {
        _logger.default.error(`get group(${groupId}) user(${userId}) name error`);
        _logger.default.error(e);
        return null;
      }})();
  }

  sendPrivateMessage(userId, message) {
    _axios.default.post(`${_config.default.QQ_SERVER}/send_private_msg`, { user_id: userId, message });
  }

  sendGroupMessage(groupId, message) {
    _axios.default.post(`${_config.default.QQ_SERVER}/send_group_msg`, { group_id: groupId, message });
  }

  banGroupUser(groupId, userId, duration) {
    _axios.default.post(`${_config.default.QQ_SERVER}/set_group_ban`, { group_id: groupId, user_id: userId, duration });
  }

  /**
     * 将接收到的postType转换成插件对应的postType
     * @param {{ post_type, messag_type }} 上报事件
     * @return {string} 事件类型
     */
  convertMessageType(event) {
    if (event.post_type === 'message') {
      return event.message_type;
    }
    return event.post_type;
  }}var _default =


new QQService();exports.default = _default;
//# sourceMappingURL=qq-service.js.map
