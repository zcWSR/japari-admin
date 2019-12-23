import axios from 'axios';
import moment from 'moment-timezone';
import logger from '../utils/logger';
import Config from '../config';
import { isDev } from '../utils/env';
import { sleep } from '../utils/process';

class QQService {
  constructor() {
    if (isDev()) {
      this.sendGroupMessage = (groupId, msg) => {
        logger.debug(`===== send to group ${groupId}`);
        msg.split('\n').forEach(line => logger.debug(line));
        logger.debug('===== done');
      };
      this.sendPrivateMessage = (userId, msg) => {
        logger.debug(`===== send to user ${userId}`);
        msg.split('\n').forEach(line => logger.debug(line));
        logger.debug('===== done');
      };
    }
  }

  async getGroupList() {
    const list = await axios.post(`${Config.QQ_SERVER}/get_group_list`);
    return list;
  }

  isSuperAdmin(userId) {
    return Config.ADMINS.includes(+userId);
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
      const meta = await axios.post(`${Config.QQ_SERVER}/get_group_member_info`, {
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
      const meta = await axios.post(`${Config.QQ_SERVER}/get_group_member_info`, {
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
    axios.post(`${Config.QQ_SERVER}/send_private_msg`, { user_id: userId, message });
  }

  sendPrivateMusic(userId, musicId) {
    this.sendPrivateMessage(userId, [
      {
        type: 'music',
        data: {
          type: '163',
          id: `${musicId}`
        }
      }
    ]);
  }

  sendGroupMessage(groupId, message) {
    if (typeof message === 'string') {
      message = {
        type: 'text',
        data: {
          text: message
        }
      };
    }
    axios.post(`${Config.QQ_SERVER}/send_group_msg`, { group_id: groupId, message });
  }

  sendGroupMusic(groupId, musicId) {
    this.sendGroupMessage(groupId, [
      {
        type: 'music',
        data: {
          type: '163',
          id: `${musicId}`
        }
      }
    ]);
  }

  banGroupUser(groupId, userId, duration) {
    axios.post(`${Config.QQ_SERVER}/set_group_ban`, {
      group_id: groupId,
      user_id: userId,
      duration
    });
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
    if (event.post_type === 'event') {
      return 'notice';
    }
    return event.post_type;
  }

  async sendReadyMessage() {
    const message = `服务(重)启动于: ${moment()
      .tz('Asia/Shanghai')
      .format('YYYY年MM月DD日 HH:mm:ss')}`;
    logger.info(message);
    await Config.ADMINS.map(async (admin, index) => {
      await this.sendPrivateMessage(admin, message);
      await sleep();
      return index;
    });
  }
}

export default new QQService();
