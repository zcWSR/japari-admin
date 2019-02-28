import path from 'path';
import { getDirFiles } from './file-service';
import { getGroupList } from './qq-service';
import logger from '../utils/logger';

class PluginService {
  plugins = {
    group: {},
    private: {},
    notice: {}
  };

  async loadPlugins(db) {
    logger.info('======== start load plugin ========');
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
      // if (result[plugin.name]) {
      //   logger.warn(`detect same name plugin '${plugin.name}', overwrite it`);
      // }
      plugin.setDBInstance(db);
      if (plugin.createTable) {
        logger.debug('create required database');
        await plugin.createTable();
      }
      if (plugin.init) {
        logger.debug('init plugin');
        await plugin.init();
      }
      if (plugin.category === 'all') {
        logger.debug("category is 'all', load into private and group plugin list");
        this.plugins.group[plugin.name] = plugin;
        this.plugins.private[plugin.name] = plugin;
      } else if (plugin.category === 'privte') {
        logger.debug("category is 'privte', load into private plugin list");
        this.plugins.private[plugin.name] = plugin;
      } else if (plugin.category === 'group') {
        logger.debug("category is 'group', load into group plugin list");
        this.plugins.group[plugin.name] = plugin;
      } else if (plugin.category === 'notice') {
        logger.debug("category is 'event', load into evnet plugin group");
        this.plugins.notice[plugin.name] = plugin;
      }
      logger.info(`load plugin '${plugin.name}' complete`);
    }
    logger.info('======== all plugin loaded ========');
  }

  async loadPluginForGroup() {
    const list = await getGroupList();

  }
}

export default new PluginService();
