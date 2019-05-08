import { Command } from '../../decorators/plugin';
import Config from '../../config';
import PluginService from '../../services/plugin-service';
import DBService from '../../services/db-service';
import QQService from '../../services/qq-service';

@Command({
  name: '插件配置',
  command: 'plugin',
  type: 'group',
  info:
    "用来配置插件开启状态, '!plugin' 来查看开启状态, '!plugin x x' 来切换开启/关闭状态, x为插件编号, 用空格分割",
  default: true,
  level: 2
})
class PluginConfig {
  getAllPlugins() {
    const { group, notice } = PluginService.plugins;
    return [...group, ...notice];
  }

  async run(params, body) {
    const { group_id: groupId } = body;
    const isAdmin = this.isAdmin(body.user_id);
    const allPluginList = this.getAllPlugins();
    const configMap = PluginService.getGroupConfig(groupId);
    if (!params) {
      let content = allPluginList.reduce((result, current, index) => {
        const hasThisPlugin = configMap[current.name];
        if (current.hide && !isAdmin) {
          return result;
        }
        result += `${index + 1}. ${current.shortInfo}${hasThisPlugin ? '(开启中)' : '(关闭)'}\n`;
        return result;
      }, '插件开启状态:\n');
      content = content.slice(0, content.length - 1);
      QQService.sendGroupMessage(groupId, content);
      return;
    }
    if (params.replace(/\d/g, '').trim()) {
      QQService.sendGroupMessage(groupId, '非法参数');
    }
    const toggleIndexs = params.trim().split(' ');
    const configMapClone = { ...configMap };
    let alertMsg = '';
    allPluginList.every((plugin, index) => {
      const currentIndex = index + 1;
      if (toggleIndexs.indexOf(currentIndex) === -1) {
        return true;
      }
      if (!isAdmin && plugin.hide) {
        alertMsg = `别试了, ${currentIndex} 你没权限操作`;
        return false;
      }
      const hasThisPlugin = configMapClone[plugin.name];
      if (hasThisPlugin) {
        delete configMapClone[plugin.name];
      } else {
        configMapClone[plugin.name] = true;
      }
      return true;
    });
    if (alertMsg) {
      QQService.sendGroupMessage(groupId, alertMsg);
      return;
    }
    await PluginService.setGroupConfig(groupId, configMapClone);
    await this.run('', body);
  }
}

export default PluginConfig;
