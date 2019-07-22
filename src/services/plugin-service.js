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
  defaultGroupConfig = [];
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
    this.groupConfigs = configArray.reduce(
      (groupMap, { groupId, pluginList: pluginNameString }) => {
        const nameList = pluginNameString.split(' ');
        groupMap[groupId] = nameList.reduce((configMap, name) => {
          configMap[name] = true;
          return configMap;
        }, {});
        return groupMap;
      },
      {}
    );
  }

  async loadPrivatePluginConfig() {
    // 暂时搞成加载全部, 后期改成可配置
    // TODO 可在config.js 配置是否加载某插件
    const nameList = this.plugins.private.map(plugin => plugin.name);
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
        continue;
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
    this.defaultGroupConfig = this.plugins.group.reduce((prev, curr) => {
      if (curr.default) {
        prev.push(curr.name);
      }
      return prev;
    }, []);
    logger.info('======== all plugin loaded ========');
    logger.info('load group plugin config');
    await this.loadGroupPluginConfig();
    logger.info('load private plugin config');
    await this.loadPrivatePluginConfig();
  }

  /**
   * 获取对应postType的所有插件列表
   * @param { string } postType 上报事件类型
   * @return {[Plugin]} 插件列表
   */
  getPlugins(postType) {
    return this.plugins[postType] || [];
  }

  /**
   * 根据groupId 获取群插件列表
   * @param {number} groupId 群id
   * @returns {{ [object]: true }} Map 结构的插件列表
   */
  getGroupConfig(groupId) {
    if (!this.groupConfigs[groupId]) {
      this.groupConfigs[groupId] = this.defaultGroupConfig.reduce((prev, curr) => {
        prev[curr] = true;
        return prev;
      }, {});
      DBService.insertGroupPluginConfig(groupId, this.defaultGroupConfig);
    }
    return this.groupConfigs[groupId];
  }

  /**
   * 根绝groupId 设置群插件列表
   * @param {number} groupId 群id
   * @param {{ [object]: true }} groupConfigMap Map 结构插件列表
   */
  async setGroupConfig(groupId, groupConfigMap) {
    this.groupConfigs[groupId] = groupConfigMap;
    const groupConfigList = Object.keys(groupConfigMap);
    await DBService.updateGroupPluginConfig(groupId, groupConfigList);
  }

  /**
   * 获取配置组
   * @param {string} type 组名
   * @param {{ group_id: string }} event 上报事件内容
   * @returns {{}} 配置组
   */
  getConfig(type, { group_id: groupId }) {
    switch (type) {
      case 'notice':
        return groupId ? this.getGroupConfig(groupId) : this.privateConfigs;
      case 'group':
        return this.getGroupConfig(groupId);
      case 'private':
        return this.privateConfigs;
      default:
        return null;
    }
  }
}

export default new PluginService();
