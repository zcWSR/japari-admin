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
  async showPlugins(body) {
    const isAdmin = Config.ADMINS.indexOf(body.user_id) > -1;
    const { group, notice } = PluginService.plugins;
    const allPluginList = [...group, ...notice];
    // const groupConfigString = await DBService.getGroupConfig(body.group_id);
    // const groupConfig = (groupConfigString || '').split(' ');
    const configMap = PluginService.getGroupConfig(body.group_id);
    let content = allPluginList.reduce((result, current, index) => {
      const hasThisPlugin = configMap[current.name];
      if (current.hide && !isAdmin) {
        return result;
      }
      result += `${index + 1}. ${current.shortInfo}${hasThisPlugin ? '(开启中)' : '(关闭)'}\n`;

      return result;
    }, '插件开启状态:\n');
    content = content.slice(0, content.length - 1);
    QQService.sendGroupMessage(body.group_id, content);
  }

  async run(params, body, type) {
    if (!params) {
      this.showPlugins(body);
    }
  }
}

export default PluginConfig;
