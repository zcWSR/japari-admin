import Config from '../config';
import logger from '../utils/logger';
import QQService from '../services/qq-service';

export const Plugin = (config) => {
  const defaultConfig = {
    name: '', // 插件名, 只可为英文名
    weight: 0, // 权重
    type: 'group', //  所属消息类别
    shortInfo: '', // 短描述
    info: '', // 插件描述
    default: false, // 默认加载, 可被群配置覆盖,
    hide: false, // 是否在
    mute: false // 不打印命中log
  };

  if (typeof config === 'string') {
    config = { ...defaultConfig, name: config };
  } else if (typeof config === 'object') {
    config = { ...defaultConfig, ...config };
  }
  return target => class extends target {
    constructor() {
      super();
      Object.keys(config).forEach((configName) => {
        this[configName] = config[configName];
      });
    }

    go(body, plugins) {
      this.mute || logger.info(`plugin ${this.name} triggered`);
      return target.prototype.go.call(this, body, plugins);
    }

    setDBInstance(instance) {
      this.DBInstance = instance;
    }
  };
};

export const Block = (target, name, descriptor) => {
  const fn = descriptor.value;
  // eslint-disable-next-line space-before-function-paren
  descriptor.value = async function value(...args) {
    return (await fn.call(this, ...args)) || true;
  };
  return descriptor;
};

export const Command = (config) => {
  const defaultConfig = {
    name: '', // 指令中文简称
    command: '', // 指令英文名, 调用时使用
    type: 'all', // 指令类型, all group private
    info: '描述', // 指令详细描述
    default: false, // 是否默认开启
    mute: false, // 不打印命中log
    level: 1, // 权限级别, 1 普通, 2 管理员, 3 总管理,
    permissionDeniedNotice: '权限不足' // 权限不足提醒文案
    // groupPermissionDeniedNotice: '', // 群权限不足提醒文案,
    // privatePermissionDeniedNotice: '' // 私聊权限不足提醒文案
  };

  if (typeof config === 'string') {
    config = { ...defaultConfig, name: config, command: config };
  } else if (typeof config === 'object') {
    config = { ...defaultConfig, ...config };
  }
  if (config.type === 'private' && config.level < 3) {
    config.level = 1;
  }
  return target => class extends target {
    constructor() {
      super();
      Object.keys(config).forEach((configName) => {
        this[configName] = config[configName];
      });
    }

    sendNoPermissionMsg({ group_id: groupId, user_id: userId }, type) {
      if (type === 'group') {
        QQService.sendGroupMessage(groupId, this.permissionDeniedNotice);
        return;
      }
      if (type === 'private') {
        QQService.sendPrivateMessage(userId, this.permissionDeniedNotice);
      }
    }

    async trigger(params, body, type, commandMap) {
      this.mute || logger.info(`command '!${this.command}' triggered, params: ${params}`);
      if (this.level === 3) {
        if (Config.ADMINS.indexOf(+body.user_id) === -1) {
          this.sendNoPermissionMsg(body, type);
        }
      } else if (this.level === 2) {
        // 只有群聊模式才会出现level=2
        const userRole = await QQService.getGroupUserRole(body.group_id, body.user_id);
        if (!(userRole === 'owner' || userRole === 'admin')) {
          QQService.sendGroupMessage(body.group_id, this.permissionDeniedNotice);
        }
      }
      return target.prototype.run.call(this, params, body, type, commandMap);
    }

    setDBInstance(instance) {
      this.DBInstance = instance;
    }
  };
};
