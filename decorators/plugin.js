import logger from '../utils/logger';

export const Plugin = (config) => {
  const defaultConfig = {
    name: '', // 插件名, 只可为英文名
    weight: 0, // 权重
    type: 'group', //  所属消息类别
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
    isAdminCommand: false // 是否为管理员指令
  };

  if (typeof config === 'string') {
    config = { ...defaultConfig, name: config, command: config };
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

    trigger(params, body) {
      this.mute || logger.info(`command '!${this.command}' triggered, params: ${params}`);
      return target.prototype.run.call(this, params, body);
    }

    setDBInstance(instance) {
      this.DBInstance = instance;
    }
  };
};
