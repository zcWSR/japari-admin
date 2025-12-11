import { Plugin } from '../decorators/plugin';
import ScheduleService from '../services/schedule-service';

@Plugin({
  name: 'schedule-db-loader',
  weight: 1,
  type: null, // 类型为空, 不添加到插件队列内
  mute: true
})
class ScheduleDBLoader {
  init() {
    return ScheduleService.runAllSchedule();
  }
}

export default ScheduleDBLoader;
