import axios from 'axios';
import logger from '../utils/logger';
import { QQ_SERVER } from '../config';

export async function getGroupList() {
  const list = await axios.post(`${QQ_SERVER}/get_group_list`);
  return list;
}

// 是否为群主
export async function isGroupOwner(groupId, userId) {
  return (await this.getGroupUserRole(groupId, userId)) === 'owner';
}

// 是否为管理人员
export async function isGroupAdminOrOwner(groupId, userId) {
  const roll = await this.getGroupUserRole(groupId, userId);
  return roll === 'admin' || roll === 'owner';
}

export async function getGroupUserRole(groupId, userId) {
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

export async function getGroupUserName(groupId, userId) {
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

export function sendPrivateMessage(userId, message) {
  axios.post(`${QQ_SERVER}/send_private_msg`, { user_id: userId, message });
}

export function sendGroupMessage(groupId, message) {
  axios.post(`${QQ_SERVER}/send_group_msg`, { group_id: groupId, message });
}

export function banGroupUser(groupId, userId, duration) {
  axios.post(`${QQ_SERVER}/set_group_ban`, { group_id: groupId, user_id: userId, duration });
}
