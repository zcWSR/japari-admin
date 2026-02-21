import { Plugin } from '../decorators/plugin';
import logger from '../utils/logger';

@Plugin({
  name: 'schedule-loader',
  weight: 1,
  type: null,
  mute: true
})
class ScheduleLoader {
  init() {
    // 定时任务由 Node 端 node-schedule 驱动，到点请求本 Worker /internal/trigger-schedule
    logger.info('schedule-loader: timer is driven by Node, no local schedule jobs');
  }
}

export default ScheduleLoader;
