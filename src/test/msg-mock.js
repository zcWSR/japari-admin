const common = {
  anonymous: '',
  anonymous_flag: '',
  font: 1415832,
  group_id: 325956463,
  message: '不合适',
  message_id: 300776,
  message_type: 'group',
  post_type: 'message',
  raw_message: '不合适',
  self_id: 3486955134,
  sender: {
    age: 23,
    card: '',
    nickname: '風·雪·雨',
    sex: 'male',
    user_id: 942403779
  },
  sub_type: 'normal',
  time: 1573723075,
  user_id: 942403779
};

const removeUser = {
  event: 'group_decrease',
  group_id: 325956463,
  operator_id: 942403779,
  post_type: 'event',
  self_id: 3486955134,
  sub_type: 'kick',
  time: 1573723084,
  user_id: 945684537
};
const addUser = {
  event: 'group_increase',
  group_id: 325956463,
  operator_id: 942403779,
  post_type: 'event',
  self_id: 3486955134,
  sub_type: 'invite',
  time: 1573723096,
  user_id: 945684537
};

export default {
  common,
  removeUser,
  addUser
};
