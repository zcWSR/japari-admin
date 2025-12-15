import path from 'path';
import logger from '../utils/logger';
import FileService from './file-service';
import KVService from './kv-service';

const GROUP_PLUGIN_CONFIG_KEY = 'group-plugin-config';

class PluginService {
  plugins = {
    loader: [],
    group: [],
    private: [],
    notice: []
  };

  groupConfigs = {};
  defaultGroupConfig = [];
  privateConfigs = [];

  // ==========================================
  // KV 数据操作
  // ==========================================

  getConfigKey(groupId) {
    return `${GROUP_PLUGIN_CONFIG_KEY}-${groupId}`;
  }

  async getGroupPluginConfig(groupId) {
    return (await KVService.getJSON(this.getConfigKey(groupId))) || [];
  }

  async saveGroupPluginConfig(groupId, pluginList) {
    return KVService.setJSON(this.getConfigKey(groupId), pluginList);
  }

  // ==========================================
  // 插件管理逻辑
  // ==========================================

  sortByWeight(pluginA, pluginB) {
    return pluginB.weight - pluginA.weight;
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
      this.plugins.notice.sort(this.sortByWeight);
    }
    if (!plugin.type || plugin.type === 'loader') {
      logger.debug("category is 'loader', load into loader plugin list");
      this.plugins.loader.push(plugin);
      this.plugins.loader.sort(this.sortByWeight);
    }
  }

  async initSerial(plugins) {
    for (const plugin of plugins) {
      if (plugin.init) {
        logger.debug('init plugin');
        await plugin.init();
      }
      logger.info(`load plugin '${plugin.name}' complete`);
    }
  }

  // 按类型 & 权重优先级顺序初始化插件
  async initAllPlugin() {
    // loader 类插件最先初始化
    await this.initSerial(this.plugins.loader);
    await this.initSerial(this.plugins.group);
    await this.initSerial(this.plugins.private);
    await this.initSerial(this.plugins.notice);
  }

  async loadPrivatePluginConfig() {
    // 暂时搞成加载全部, 后期改成可配置
    // TODO 可在config.js 配置是否加载某插件
    const nameList = this.plugins.private.map((plugin) => plugin.name);
    nameList.forEach((name) => {
      this.privateConfigs[name] = true;
    });
  }

  async loadPlugins() {
    logger.info('======== start load plugin ========');
    for (const file of FileService.getDirFiles(path.resolve(__dirname, '../plugins'))) {
      const required = require(file.path);
      if (!required || !required.default) {
        logger.warn('wrong plugin constructor!!!!!, skip');
        logger.warn(`check file at: ${file.path}`);
        continue;
      }
      const Plugin = required.default;
      const plugin = new Plugin();
      if (!plugin.name) throw new Error('plugin require a name');
      this.classifyPlugin(plugin);
    }
    await this.initAllPlugin();
    this.defaultGroupConfig = this.plugins.group.reduce((prev, curr) => {
      if (curr.default) {
        prev.push(curr.name);
      }
      return prev;
    }, []);
    logger.info('======== all plugin loaded ========');
    logger.info('load private plugin config');
    await this.loadPrivatePluginConfig();
  }

  /**
   * 获取对应postType的所有插件列表
   * @param {string} postType 上报事件类型
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
  async getGroupConfig(groupId) {
    if (this.groupConfigs[groupId]) {
      return this.groupConfigs[groupId];
    }
    let config = null;
    try {
      logger.info(`did not find local group(${groupId}) config cache, getting from KV...`);
      config = await this.getGroupPluginConfig(groupId);
      if (!Array.isArray(config) || !config.length) {
        logger.info('config not found, use default');
        config = this.defaultGroupConfig;
      } else {
        logger.info(`got config, ${JSON.stringify(config)}`);
      }
    } catch (e) {
      logger.error('get from KV error');
      logger.error(e);
      config = this.defaultGroupConfig;
    }
    logger.info('saving to cache...');
    this.groupConfigs[groupId] = config.reduce((prev, curr) => {
      prev[curr] = true;
      return prev;
    }, {});
    await this.saveGroupPluginConfig(groupId, config);
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
    await this.saveGroupPluginConfig(groupId, groupConfigList);
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
