import { Route, Router } from '../decorators/router';
import botErrorReporter from '../middlewares/bot-error-reporter';
import GenshinService from '../services/genshin-service';
import PluginService from '../services/plugin-service';
import QQService from '../services/qq-service';

@Router()
class JapariController {
  @Route.get('/')
  main() {
    return "<h1>ようこそ！ジャパリパークへ！</h1><script>console.log('/japari/event is bot')</script>";
  }

  @Route.post('/event', botErrorReporter)
  async allEvent({ request }) {
    const fromBot = request.body;
    const type = QQService.convertMessageType(fromBot);
    const plugins = PluginService.getPlugins(type);
    const config = await PluginService.getConfig(type, fromBot);
    if (!config) return {};
    for (const plugin of plugins) {
      if (!config[plugin.name]) continue;
      if ((await plugin.go(fromBot, type)) === 'break') break;
    }
    return {};
  }

  @Route.post('/message', botErrorReporter)
  async message({ request }) {
    const { type, data } = request.body;
    if (type === 'genshinUpdate') {
      GenshinService.updateCache(data);
    }
    return 'ok';
  }
}

export default JapariController;
