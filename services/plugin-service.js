import path from 'path';
import { getDirFiles } from './file-service';
import logger from '../utils/logger';

class PluginService {
  plugins = {};
  async loadPlugins(db) {
    logger.info('======== start load plugin ========');
    const result = {};
    // eslint-disable-next-line no-restricted-syntax
    for (const file of getDirFiles(path.resolve(__dirname, '../plugins'))) {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const required = require(file.path);
      if (!required || !required.default) {
        logger.warn('wrong plugin constructor!!!!!, skip');
        logger.warn(`check file at: ${file.path}`);
        break;
      }
      const Plugin = required.default;
      const plugin = new Plugin();
      if (!plugin.name) throw new Error('plugin require a name');
      if (result[plugin.name]) {
        logger.warn(`detect same name plugin '${plugin.name}', overwrite it`);
      }
      plugin.setDBInstance(db);
      if (plugin.init) {
        await plugin.init();
      }
      if (plugin.createTable) {
        await plugin.createTable();
      }
      result[plugin.name] = plugin;
      logger.info(`load plugin '${plugin.name}' complete`);
    }
    logger.info('======== all plugin loaded ========');
    return result;
  }
}

export default new PluginService();
