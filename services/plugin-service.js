import path from 'path';
import FileService from './file-service';
import DBService from './db-service';
import logger from '../utils/logger';

class PluginService {
  plugins = {
    group: [],
    private: [],
    notice: []
  };

  groupConfigs = {};
  privateConfigs = [];

  sortByWeight(pluginA, pluginB) {
    return pluginA.weight - pluginB.weight;
  }

  classifyPlugin(plugin) {
    if (plugin.type === 'message' || plugin.type === 'private') {
      logger.debug(`category is '${plugin.type}', load into private plugin list`);
      this.plugins.private.push(plugin);
      this.plugins.private.sort(this.sortByWeight);
    }
    if (plugin.type === 'message' || plugin.type === 'group') {
      logger.debug(`category is '${plugin.type}', load into group plugin list`);
      this.plugins.group.push(plugin);
      this.plugins.group.sort(this.sortByWeight);
    }
    if (plugin.type === 'notice') {
      logger.debug("category is 'notice', load into notice plugin list");
      this.plugins.notice.push(plugin);
      this.plugins.notice.some(this.sortByWeight);
    }
  }

  async loadGroupPluginConfig() {
    const configArray = (await DBService.getAllGroupPluginConfig()) || [];
    this.groupConfig = configArray.reduce((groupMap, { groupId, pluginList: pluginNameString }) => {
      const nameList = pluginNameString.split(' ');
      groupMap[groupId] = nameList.reduce((configMap, name) => {
        configMap[name] = true;
        return configMap;
      }, {});
      return groupMap;
    }, {});
  }

  async loadPrivatePluginConfig() {
    // 暂时搞成加载全部, 后期改成可配置
    // TODO
    const nameList = this.privateConfigs.map(plugin => plugin.name);
    nameList.forEach((name) => {
      this.privateConfigs[name] = true;
    });
  }

  async loadPlugins(db) {
    logger.info('======== start load plugin ========');
    // eslint-disable-next-line no-restricted-syntax
    for (const file of FileService.getDirFiles(path.resolve(__dirname, '../plugins'))) {
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
      this.classifyPlugin(plugin);
      logger.info(`load plugin '${plugin.name}' complete`);
    }
    logger.info('======== all plugin loaded ========');
    logger.info('load group plugin config');
    await this.loadGroupPluginConfig();
    logger.info('load private plugin config');
    await this.loadPrivatePluginConfig();
  }

  getPlugins(postType) {
    return this.plugins[postType] || [];
  }

  getConfig(type, { group_id: groupId }) {
    switch (type) {
      case 'notice':
        return groupId ? this.groupConfigs[groupId] : this.privateConfigs;
      case 'group':
        return this.groupConfigs[groupId];
      case 'private':
        return this.privateConfigs;
      default:
        return [];
    }
  }
}

export default new PluginService();
