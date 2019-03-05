export const Plugin = (config) => {
  const defaultConfig = {
    name: '', // 插件名, 只可为英文名
    weight: 0, // 权重
    type: 'group', //  所属消息类别
    info: '', // 插件描述
    default: false, // 默认加载, 可被群配置覆盖,
    hide: false // 是否在
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

    setDBInstance(instance) {
      this.DBInstance = instance;
    }
  };
};


export const Block = (target, name, descriptor) => {
  const fn = descriptor.value;
  // eslint-disable-next-line space-before-function-paren
  descriptor.value = function value(...args) {
    fn.call(this, ...args);
    return 1;
  };
  return descriptor;
};
