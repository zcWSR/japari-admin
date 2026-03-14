import { getShangHaiTimeParts } from '../utils/date';
import logger from '../utils/logger';
import D1Service from './d1-service';
import QQService from './qq-service';

const DAY_NAME_MAP: Record<number, string> = {
  0: '星期天',
  1: '星期一',
  2: '星期二',
  3: '星期三',
  4: '星期四',
  5: '星期五',
  6: '星期六',
  7: '星期天'
};

export interface ScheduleRow {
  group_id: number;
  rule: string;
  text: string;
  updated_at: number;
}

interface ParsedRule {
  rule: string;
  hours: number[];
  days: number[];
}

class ScheduleService {
  async getAllSchedules(): Promise<ScheduleRow[]> {
    return D1Service.all('SELECT * FROM schedules') as Promise<ScheduleRow[]>;
  }

  async getScheduleByGroupId(groupId: number): Promise<ScheduleRow | null> {
    const row = await D1Service.first('SELECT * FROM schedules WHERE group_id = ?', [
      String(groupId)
    ]);
    return row as ScheduleRow | null;
  }

  async saveSchedule(
    groupId: number,
    rule: string,
    text: string
  ): Promise<{ results: unknown[] }> {
    return D1Service.query(
      `INSERT INTO schedules (group_id, rule, text, updated_at) VALUES (?, ?, ?, strftime('%s', 'now'))
       ON CONFLICT(group_id) DO UPDATE SET rule = excluded.rule, text = excluded.text, updated_at = excluded.updated_at`,
      [String(groupId), rule, text]
    );
  }

  async deleteSchedule(groupId: number): Promise<{ results: unknown[] }> {
    return D1Service.query('DELETE FROM schedules WHERE group_id = ?', [String(groupId)]);
  }

  async getAllSchedule(): Promise<ScheduleRow[]> {
    return this.getAllSchedules();
  }

  getScheduleName(groupId: number): string {
    return `s-${groupId}`;
  }

  getRuleFromString(ruleString: string): ParsedRule {
    let [hourString, dayString = 'everyday'] = ruleString.split(' ');
    let hours = hourString.split(',').reduce<number[]>((result, hour) => {
      const h = Number.parseInt(hour, 10);
      if (h >= 0 && h <= 23 && !result.includes(h)) result.push(h);
      return result;
    }, []);
    if (!hours.length) {
      hours = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    }
    hours = hours.sort((a, b) => a - b);

    if (dayString === 'weekend' || dayString === '周末') dayString = '6,7';
    if (dayString === 'weekday' || dayString === '工作日') dayString = '1,2,3,4,5';
    if (dayString === 'everyday' || dayString === '每天') dayString = '1,2,3,4,5,6,7';

    let days = dayString.split(',').reduce<number[]>((result, day) => {
      const d = Number.parseInt(day, 10);
      if (d >= 0 && d <= 7 && !result.includes(d)) result.push(d);
      return result;
    }, []);
    if (!days.length) days = [1, 2, 3, 4, 5];
    days = days.sort((a, b) => a - b);

    return {
      rule: `0 0 ${hours.join(',')} ? * ${days.join(',')}`,
      hours,
      days
    };
  }

  formatText(text: string): string {
    const { hours, minutes, seconds, year, month, date, day } = getShangHaiTimeParts();
    return text
      .replace(/\\n/g, '\n')
      .replace(/\$\{hour\}/g, String(hours))
      .replace(/\$\{minute\}/g, String(minutes))
      .replace(/\$\{second\}/g, String(seconds))
      .replace(/\$\{year\}/g, String(year))
      .replace(/\$\{month\}/g, String(month))
      .replace(/\$\{date\}/g, String(date))
      .replace(/\$\{day\}/g, DAY_NAME_MAP[day] ?? '');
  }

  sendText(groupId: number, text: string): void {
    const formattedText = this.formatText(text);
    logger.info(`auto sendText to ${String(groupId)} ${formattedText}`);
    QQService.sendGroupMessage(groupId, formattedText);
  }

  parseSchedule(_groupId: number, ruleString: string): { hours: number[]; days: number[] } {
    const { hours, days } = this.getRuleFromString(ruleString);
    return { hours, days };
  }

  async runAllSchedule(): Promise<void> {
    logger.info('schedule driven by Node, no local jobs');
  }

  cancelSchedule(_id: string): void {}

  async setSchedule(
    groupId: number,
    rule: string,
    text: string
  ): Promise<{ hours: number[]; days: number[] }> {
    const { hours, days } = this.parseSchedule(groupId, rule);
    const ruleString = `${hours.join(',')} ${days.join(',')}`;
    await this.saveSchedule(groupId, ruleString, text);
    return { hours, days };
  }

  async removeSchedule(groupId: number): Promise<number> {
    await this.deleteSchedule(groupId);
    return 0;
  }

  async triggerSendForGroup(groupId: number): Promise<void> {
    const row = await this.getScheduleByGroupId(groupId);
    if (!row?.text) return;
    const formattedText = this.formatText(row.text);
    logger.info('trigger-schedule send to group %s', groupId);
    QQService.sendGroupMessage(groupId, formattedText);
  }

  ruleToShownString(hours: number[], days: number[]): string {
    let result = '';
    if (days[0] === 6 && days.length === 2) {
      result = '每周末的';
    } else if (days[0] === 1 && !days.includes(6) && !days.includes(7) && days.length === 5) {
      result = '每周工作日的';
    } else if (days[0] === 1 && days.length === 7) {
      result = '每天的';
    } else {
      result = `${days
        .reduce((prev, current) => `${prev}${DAY_NAME_MAP[current]}、`, '每周')
        .slice(0, -1)}的`;
    }
    return hours.reduce((prev, current) => `${prev}${current}点`, result);
  }
}

export default new ScheduleService();
