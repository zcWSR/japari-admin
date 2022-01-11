import { Command } from '../../decorators/plugin';
import QQService from '../../services/qq-service';

@Command({
  name: 'pr',
  command: 'pr',
  type: 'group',
  info: '舔',
  default: true,
  level: 1
})
class Roll {
  noPr() {
    return Math.random() < 0.1;
  }

  run(params, body) {
    let content = 'prpr';
    if (params) {
      content = Math.random() > 0.5 ? `舔舔${params}` : `[CQ:poke,qq=${body.user_id}]`;
    }
    if (this.noPr()) {
      content = '不舔了, 舔不动了';
    }
    QQService.sendGroupMessage(body.group_id, content);
  }
}

export default Roll;
