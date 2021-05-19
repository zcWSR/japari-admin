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
        if (msg.split) {
          msg.split('\n').forEach(line => logger.debug(line));
        } else {
          logger.debug(msg);
        }
        logger.debug('===== done');
      };
      this.sendPrivateMessage = (userId, msg) => {
        logger.debug(`===== send to user ${userId}`);
        if (msg.split) {
          msg.split('\n').forEach(line => logger.debug(line));
        } else {
          logger.debug(msg);
        }
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

  sendPrivateImage(userId, dataUrl) {
    this.sendPrivateMessage(userId, [
      {
        type: 'image',
        data: {
          file: `base64://${dataUrl}`
        }
      }
    ]);
  }

  sendGroupMessage(groupId, message) {
    axios.post(`${Config.QQ_SERVER}/send_group_msg`, { group_id: groupId, message });
  }

  sendGroupImage(groupId, dataUrl) {
    this.sendGroupMessage(groupId, [
      {
        type: 'image',
        data: {
          file: `base64://${dataUrl}`
        }
      }
    ]);
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

  authCheckFuncMap = {
    owner: this.isGroupOwner,
    admin: this.isGroupAdminOrOwner
  };

  async checkRateWithMessage(
    rate,
    groupId,
    userId,
    min = 0,
    max = 1,
    rateNeedAuth = 0.5,
    authLevel = 'owner'
  ) {
    if (Number.isNaN(rate)) {
      this.sendGroupMessage(groupId, '参数非法');
      return false;
    }
    if (rate < min) {
      this.sendGroupMessage(groupId, `不可设置小于${(min * 100).toFixed(0)}%的值`);
      return false;
    }
    if (rate > max) {
      this.sendGroupMessage(groupId, `不可设置大于${(max * 100).toFixed(0)}%的值`);
      return false;
    }
    if (rateNeedAuth && rate > rateNeedAuth) {
      if (await this.authCheckFuncMap[authLevel].call(this, groupId, userId)) {
        return true;
      }
      const level = authLevel === 'auth' ? '管理员及以上' : '群主';
      this.sendGroupMessage(
        groupId,
        `设置概率为${(rateNeedAuth * 100).toFixed(0)}%及以上仅${level}有权限`
      );
      return false;
    }
    return true;
  }
}

export default new QQService();
