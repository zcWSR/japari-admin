import { Command } from '../../decorators/plugin';
import QQService from '../../services/qq-service';
import ScheduleService from '../../services/schedule-service';

@Command({
  name: '设置定时内容',
  command: 'schedule',
  type: 'group',
  info:
    // eslint-disable-next-line no-template-curly-in-string
    "设置定时显示文字内容, '!schedule 内容' 来调用\n内容不写为查看当前配置\n'!schedule clear' 为清除当前配置\n提供参数 year month date day hour minute second, 用${xxx}来插入",
  level: 2
})
class Schedule {
  async run(params, body) {
    const { group_id: groupId } = body;
    const currentSchedule = await ScheduleService.getScheduleByGroupId(groupId);
    if (currentSchedule) {
      const { hours, days } = ScheduleService.getRuleFromString(currentSchedule.rule);
      let result = '';
      if (!params) {
        result = '当前设定:\n';
        result += `${ScheduleService.ruleToShownString(hours, days)}`;
        result += `\n执行内容: ${currentSchedule.text}`;
      } else if (params === 'clear') {
        await ScheduleService.removeSchedule(
          currentSchedule.group_id,
          currentSchedule.name
        );
        QQService.sendGroupMessage(groupId, '已清除定时内容');
        return;
      } else {
        const { hours: newHours, days: newDays } = await ScheduleService.setSchedule(
          groupId,
          currentSchedule.rule,
          params
        );
        result = '设置成功\n';
        result += ScheduleService.ruleToShownString(newHours, newDays);
        result += `\n执行内容: ${params}`;
      }
      QQService.sendGroupMessage(groupId, result);
      return;
    }
    QQService.sendGroupMessage(
      groupId,
      "任务不存在, 请先使用指令 '!scheduleTime' 设置任务内容时间"
    );
  }
}

export default Schedule;
