import type { IPlugin, PluginPostType } from '@/types/onebot';
import { ensurePluginsLoaded } from '../lib/ensure-plugins';
import { plugins as pluginList } from '../plugins/registry';
import logger from '../utils/logger';
import KVService from './kv-service';

const GROUP_PLUGIN_CONFIG_KEY = 'group-plugin-config';

type PluginCategory = 'loader' | 'group' | 'private' | 'notice';

/** 群插件配置：插件名 -> 是否开启 */
export type GroupConfigMap = Record<string, boolean>;

class PluginService {
  plugins: Record<PluginCategory, IPlugin[]> = {
    loader: [],
    group: [],
    private: [],
    notice: []
  };

  groupConfigs: Record<string, GroupConfigMap> = {};
  defaultGroupConfig: string[] = [];
  privateConfigs: Record<string, boolean> = {};

  getConfigKey(groupId: number | string): string {
    return `${GROUP_PLUGIN_CONFIG_KEY}-${groupId}`;
  }

  get configKeyPrefix(): string {
    return `${GROUP_PLUGIN_CONFIG_KEY}-`;
  }

  async getGroupPluginConfig(groupId: number): Promise<string[]> {
    const raw = await KVService.getJSON<string[]>(this.getConfigKey(groupId));
    return raw ?? [];
  }

  async getAllGroupIds(): Promise<string[]> {
    await ensurePluginsLoaded();
    const keys = await KVService.listKeyNames(this.configKeyPrefix);
    return keys.map((name) => name.slice(this.configKeyPrefix.length)).filter(Boolean);
  }

  async saveGroupPluginConfig(groupId: number, pluginListArr: string[]): Promise<boolean> {
    return KVService.setJSON(this.getConfigKey(groupId), pluginListArr);
  }

  /** 删除群配置（超管在群列表删除用），并清除内存缓存 */
  async deleteGroupConfig(groupId: string): Promise<boolean> {
    const key = this.getConfigKey(groupId);
    const ok = await KVService.delete(key);
    delete this.groupConfigs[groupId];
    return ok;
  }

  sortByWeight(pluginA: IPlugin, pluginB: IPlugin): number {
    return (pluginB.weight ?? 0) - (pluginA.weight ?? 0);
  }

  classifyPlugin(plugin: IPlugin): void {
    if (plugin.type === 'message' || plugin.type === 'private') {
      logger.debug(`category is '${plugin.type}', load into private plugin list`);
      this.plugins.private.push(plugin);
      this.plugins.private.sort(this.sortByWeight.bind(this));
    }
    if (plugin.type === 'message' || plugin.type === 'group') {
      logger.debug(`category is '${plugin.type}', load into group plugin list`);
      this.plugins.group.push(plugin);
      this.plugins.group.sort(this.sortByWeight.bind(this));
    }
    if (plugin.type === 'notice') {
      logger.debug("category is 'notice', load into notice plugin list");
      this.plugins.notice.push(plugin);
      this.plugins.notice.sort(this.sortByWeight.bind(this));
    }
    if (!plugin.type || plugin.type === 'loader') {
      logger.debug("category is 'loader', load into loader plugin list");
      this.plugins.loader.push(plugin);
      this.plugins.loader.sort(this.sortByWeight.bind(this));
    }
  }

  async initSerial(plugins: IPlugin[]): Promise<void> {
    for (const plugin of plugins) {
      if (plugin.init) {
        logger.debug('init plugin');
        await plugin.init();
      }
      logger.info(`load plugin '${plugin.name}' complete`);
    }
  }

  async initAllPlugin(): Promise<void> {
    await this.initSerial(this.plugins.loader);
    await this.initSerial(this.plugins.group);
    await this.initSerial(this.plugins.private);
    await this.initSerial(this.plugins.notice);
  }

  async loadPrivatePluginConfig(): Promise<void> {
    const nameList = this.plugins.private.map((p) => p.name);
    for (const name of nameList) {
      this.privateConfigs[name] = true;
    }
  }

  async loadPlugins(): Promise<void> {
    logger.info('======== start load plugin ========');
    for (const P of pluginList) {
      const plugin: IPlugin =
        typeof P === 'function' ? new (P as unknown as new () => IPlugin)() : (P as IPlugin);
      if (!plugin?.name) {
        logger.warn('invalid plugin in registry, skip');
        continue;
      }
      this.classifyPlugin(plugin);
    }
    await this.initAllPlugin();
    this.defaultGroupConfig = this.plugins.group.filter((p) => p.default).map((p) => p.name);
    logger.info('======== all plugin loaded ========');
    logger.info('load private plugin config');
    await this.loadPrivatePluginConfig();
  }

  async getPlugins(postType: PluginPostType): Promise<IPlugin[]> {
    await ensurePluginsLoaded();
    return this.plugins[postType] ?? [];
  }

  async getGroupAndNoticePlugins(): Promise<{ group: IPlugin[]; notice: IPlugin[] }> {
    await ensurePluginsLoaded();
    return { group: this.plugins.group, notice: this.plugins.notice };
  }

  async getGroupConfig(groupId: number): Promise<GroupConfigMap> {
    await ensurePluginsLoaded();
    if (this.groupConfigs[groupId]) {
      return this.groupConfigs[groupId]!;
    }
    let config: string[] | null = null;
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
    const map: GroupConfigMap = {};
    for (const curr of config) {
      map[curr] = true;
    }
    this.groupConfigs[groupId] = map;
    await this.saveGroupPluginConfig(groupId, config);
    return this.groupConfigs[groupId]!;
  }

  async setGroupConfig(groupId: number, groupConfigMap: GroupConfigMap): Promise<void> {
    await ensurePluginsLoaded();
    this.groupConfigs[groupId] = groupConfigMap;
    const groupConfigList = Object.keys(groupConfigMap);
    await this.saveGroupPluginConfig(groupId, groupConfigList);
  }

  async getConfig(
    type: PluginPostType,
    event: { group_id?: string }
  ): Promise<GroupConfigMap | Record<string, boolean> | null> {
    await ensurePluginsLoaded();
    const groupId = event.group_id;
    switch (type) {
      case 'notice':
        return groupId ? this.getGroupConfig(Number(groupId)) : this.privateConfigs;
      case 'group':
        return groupId ? this.getGroupConfig(Number(groupId)) : null;
      case 'private':
        return this.privateConfigs;
      default:
        return null;
    }
  }
}

export default new PluginService();
