export const Plugin = (config) => {
  let name;
  let weight = 0;
  let category = 'group';
  let info = '';
  if (typeof config === 'string') {
    name = config;
  } else if (typeof config === 'object') {
    name = config.name || name;
    weight = config.weight || weight;
    category = config.category || category;
    info = config.info || info;
  }
  return target => class extends target {
      isPlugin = true;
      name = name;
      weight = weight;
      category = category;
      info = info;
      setDBInstance(instance) {
        this.DBInstance = instance;
      }
  };
};
