import logger from '../utils/logger';

/**
 * @param {string} tableName
 */
export const createWithLog = tableName => (target, name, descriptor) => {
  const origin = descriptor.value;
  // eslint-disable-next-line
  descriptor.value = async function() {
    try {
      if (!this.DBInstance) {
        throw new Error("no db instance, may be your plugin class has not extends class 'Plugin'");
      }
      if (await this.DBInstance.schema.hasTable(tableName)) {
        logger.info(`table '${tableName}' exists, skip`);
      } else {
        logger.info(`table '${tableName}' is creating`);
        await this.DBInstance.schema.createTable(tableName, origin.bind(this));
        logger.info(`table '${tableName}' has been created`);
      }
    } catch (e) {
      logger.error(`an error occured during table '${tableName}' check`);
      logger.error(e.toString());
      throw new Error('create or check table with Error');
    }
  };
  return descriptor;
};

export const withTransaction = (target, name, descriptor) => {
  const origin = descriptor.value;
  // eslint-disable-next-line
  descriptor.value = function(...args) {
    // try {
    return this.DBInstance.transaction(trx => origin.call(this, trx, ...args));
    // } catch (e) {
    //   logger.error(e);
    //   return null;
    // }
  };
  return descriptor;
};
