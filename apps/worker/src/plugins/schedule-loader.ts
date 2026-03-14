import { PluginBase } from '@/decorators/types';
import { Plugin } from '../decorators/plugin';
import logger from '../utils/logger';

@Plugin({
  name: 'schedule-loader',
  weight: 1,
  type: 'loader',
  mute: true
})
class ScheduleLoader extends PluginBase {
  async init() {
    // 定时任务由 Node 端 node-schedule 驱动，到点请求本 Worker /internal/trigger-schedule
    logger.info('schedule-loader: timer is driven by Node, no local schedule jobs');
  }

  go() {
    return;
  }
}

export default ScheduleLoader;
