import { Router, Route } from '../decorators/router';
import botErrorReporter from '../middlewares/bot-error-reporter';
import PluginService from '../services/plugin-service';
import QQService from '../services/qq-service';

@Router()
class JapariController {
  @Route.post('/event', botErrorReporter)
  async allEvent({ request }) {
    const fromBot = request.body;
    const type = QQService.getMessageType(fromBot);
    const plugins = PluginService.getPlugins(type);
    const config = await PluginService.getConfig(type, fromBot);
    plugins.every((plugin) => {
      // 如果当前插件不在配置列表里, 直接跳过
      if (!config[plugin.name]) return true;
      return plugin.go(fromBot);
    });
    return {};
  }
}

export default JapariController;
