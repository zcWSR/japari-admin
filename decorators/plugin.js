export const Plugin = (config) => {
  let name;
  let weight = 0;
  let type = 'group';
  let info = '';
  if (typeof config === 'string') {
    name = config;
  } else if (typeof config === 'object') {
    name = config.name || name;
    weight = config.weight || weight;
    type = config.category || type;
    info = config.info || info;
  }
  return target => class extends target {
      isPlugin = true;
      name = name;
      weight = weight;
      category = type;
      info = info;
      setDBInstance(instance) {
        this.DBInstance = instance;
      }
  };
};
