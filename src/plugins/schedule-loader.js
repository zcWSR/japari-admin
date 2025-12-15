import { Plugin } from '../decorators/plugin';
import ScheduleService from '../services/schedule-service';

@Plugin({
  name: 'schedule-loader',
  weight: 1,
  type: null,
  mute: true
})
class ScheduleLoader {
  init() {
    return ScheduleService.runAllSchedule();
  }
}

export default ScheduleLoader;
