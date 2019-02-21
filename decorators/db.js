import logger from '../utils/logger';

export const createWithLog = tableName => (target, name, descriptor) => {
  const origin = descriptor.value;
  // eslint-disable-next-line
  descriptor.value = async function() {
    try {
      if (await this.DBInstance.schema.hasTable('osu_bind')) {
        logger.info(`table '${tableName}' exists, skip`);
      } else {
        logger.info(`table '${tableName}' is creating`);
        await this.DBInstance.schema.createTable(tableName, origin.bind(this));
        logger.info(`table '${tableName}' has been created`);
      }
    } catch (e) {
      logger.error(`an error occured during table '${tableName}' check`);
      logger.error(e.toString());
    }
  };
  return descriptor;
};
