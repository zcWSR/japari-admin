import axios from 'axios';
import logger from '../utils/logger';
import { QQ_SERVER } from '../config';

class QQService {
  async getGroupList() {
    const list = await axios.post(`${QQ_SERVER}/get_group_list`);
    return list;
  }

  // 是否为群主
  async isGroupOwner(groupId, userId) {
    return (await this.getGroupUserRole(groupId, userId)) === 'owner';
  }

  // 是否为管理人员
  async isGroupAdminOrOwner(groupId, userId) {
    const roll = await this.getGroupUserRole(groupId, userId);
    return roll === 'admin' || roll === 'owner';
  }

  async getGroupUserRole(groupId, userId) {
    try {
      const meta = await axios.post(`${QQ_SERVER}/get_group_member_info`, {
        group_id: groupId,
        user_id: userId
      });
      const memberInfo = meta.data.data;
      if (!memberInfo) return null;
      if (!memberInfo.user_id) return null;
      return memberInfo.role;
    } catch (e) {
      logger.error(`get group(${groupId}) user(${userId}) role error`);
      logger.error(e);
      return null;
    }
  }

  async getGroupUserName(groupId, userId) {
    try {
      const meta = await axios.post(`${QQ_SERVER}/get_group_member_info`, {
        group_id: groupId,
        user_id: userId
      });
      const memberInfo = meta.data.data;
      if (!memberInfo) return null;
      return memberInfo.nickname;
    } catch (e) {
      logger.error(`get group(${groupId}) user(${userId}) name error`);
      logger.error(e);
      return null;
    }
  }

  sendPrivateMessage(userId, message) {
    axios.post(`${QQ_SERVER}/send_private_msg`, { user_id: userId, message });
  }

  sendGroupMessage(groupId, message) {
    axios.post(`${QQ_SERVER}/send_group_msg`, { group_id: groupId, message });
  }

  banGroupUser(groupId, userId, duration) {
    axios.post(`${QQ_SERVER}/set_group_ban`, { group_id: groupId, user_id: userId, duration });
  }

  // 将接收到的postType转换成插件的type
  getMessageType(msg) {
    if (msg.post_type === 'message') {
      return msg.message_type;
    }
    return msg.post_type;
  }
}

export default new QQService();
