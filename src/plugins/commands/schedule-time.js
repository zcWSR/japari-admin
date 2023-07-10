import { Command, LEVEL } from '../../decorators/plugin';
import QQService from '../../services/qq-service';
import ScheduleService from '../../services/schedule-service';

// eslint-disable-next-line no-template-curly-in-string
const DEFAULT_TEXT = '${hour}点了!';

@Command({
  name: '设置定时内容时间',
  command: 'scheduleTime',
  type: 'group',
  level: LEVEL.ADMIN,
  info:
    "设置定时任务时间, '!scheduleTime xxx yyy' 来调用\nxxx为每日几时执行, 为数字, 例如 '6,7,8' '23', 区间0-23, 用逗号分隔\nyyy为周几执行, 可以不填, 默认为每天\n可设为 '每天' 或 'everyday', '工作日' 或 'weekday', '周末' 或 'weekend', 或用数字表示, 区间0-7, 用逗号分隔"
})
class ScheduleTime {
  async run(params, body) {
    const { group_id: groupId } = body;
    if (!params) {
      QQService.sendGroupMessage(groupId, '参数非法, 请输入必要参数');
      return;
    }

    const [hourString, dayString = 'weekend'] = params.split(' ');
    if (
      !(
        hourString.match(/^([1-2]?[0-9],?)+$/) &&
        dayString.match(/^(weekend|周末|everyday|每天|workday|工作日)|(([1-7],?)+)$/)
      )
    ) {
      QQService.sendGroupMessage(groupId, '参数非法');
      return;
    }
    const currentSchedule = await ScheduleService.getScheduleByGroupId(groupId);
    let result = '设置成功\n';
    const { hours, days } = await ScheduleService.setSchedule(
      groupId,
      params,
      currentSchedule ? currentSchedule.text : DEFAULT_TEXT
    );
    if (!currentSchedule) {
      result += ScheduleService.ruleToShownString(hours, days);
      result += "\n执行默认内容: 'x点了!'";
    } else {
      result += ScheduleService.ruleToShownString(hours, days);
      result += `\n执行内容: ${currentSchedule.text}`;
    }
    QQService.sendGroupMessage(groupId, result);
  }
}

export default ScheduleTime;
