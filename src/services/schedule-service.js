import schedule, { scheduleJob } from 'node-schedule';
import { getShangHaiTimeParts } from '../utils/date';
import logger from '../utils/logger';
import D1Service from './d1-service';
import QQService from './qq-service';

const DAY_NAME_MAP = {
  0: '星期天',
  1: '星期一',
  2: '星期二',
  3: '星期三',
  4: '星期四',
  5: '星期五',
  6: '星期六',
  7: '星期天'
};

class ScheduleService {
  // ==========================================
  // D1 数据操作
  // ==========================================

  async getAllSchedules() {
    return D1Service.all('SELECT * FROM schedules');
  }

  async getScheduleByGroupId(groupId) {
    return D1Service.first('SELECT * FROM schedules WHERE group_id = ?', [String(groupId)]);
  }

  async saveSchedule(groupId, rule, text) {
    return D1Service.query(
      `INSERT INTO schedules (group_id, rule, text, updated_at) VALUES (?, ?, ?, strftime('%s', 'now'))
       ON CONFLICT(group_id) DO UPDATE SET rule = excluded.rule, text = excluded.text, updated_at = excluded.updated_at`,
      [String(groupId), rule, text]
    );
  }

  async deleteSchedule(groupId) {
    return D1Service.query('DELETE FROM schedules WHERE group_id = ?', [String(groupId)]);
  }

  // ==========================================
  // 业务逻辑
  // ==========================================

  async getAllSchedule() {
    return this.getAllSchedules();
  }

  getScheduleName(groupId) {
    return `s-${groupId}`;
  }

  getRuleFromString(ruleString) {
    let [hourString, dayString = 'everyday'] = ruleString.split(' ');
    let hours = hourString.split(',').reduce((result, hour) => {
      hour = Number.parseInt(hour, 10);
      if (hour >= 0 && hour <= 23 && result.indexOf(hour) === -1) {
        result.push(hour);
      }
      return result;
    }, []);
    if (!hours.length) {
      hours = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    }
    hours = hours.sort();
    if (dayString === 'weekend' || dayString === '周末') {
      dayString = '6,7';
    }
    if (dayString === 'weekday' || dayString === '工作日') {
      dayString = '1,2,3,4,5';
    }
    if (dayString === 'everyday' || dayString === '每天') {
      dayString = '1,2,3,4,5,6,7';
    }
    let days = dayString.split(',').reduce((result, day) => {
      day = Number.parseInt(day, 10);
      if (day >= 0 && day <= 7 && result.indexOf(day) === -1) {
        result.push(day);
      }
      return result;
    }, []);
    if (!days.length) {
      days = [1, 2, 3, 4, 5];
    }
    days = days.sort();
    return {
      rule: `0 0 ${hours.join(',')} ? * ${days.join(',')}`,
      hours,
      days
    };
  }

  formatText(text) {
    const { hours, minutes, seconds, year, month, date, day } = getShangHaiTimeParts();
    return text
      .replace(/\\n/g, '\n')
      .replace(/\$\{hour\}/g, hours)
      .replace(/\$\{minute\}/g, minutes)
      .replace(/\$\{second\}/g, seconds)
      .replace(/\$\{year\}/g, year)
      .replace(/\$\{month\}/g, month)
      .replace(/\$\{date\}/g, date)
      .replace(/\$\{day\}/g, DAY_NAME_MAP[day]);
  }

  sendText(groupId, text) {
    const formattedText = this.formatText(text);
    logger.info('auto sendText to', groupId, formattedText);
    QQService.sendGroupMessage(groupId, formattedText);
  }

  runSchedule(groupId, ruleString, text) {
    const { hours, days, rule } = this.getRuleFromString(ruleString);
    const name = this.getScheduleName(groupId);
    scheduleJob(name, { rule, tz: 'Asia/Shanghai' }, this.sendText.bind(this, groupId, text));
    logger.info(`run schedule '${name}', rule '${rule}'`);
    return { hours, days };
  }

  async runAllSchedule() {
    try {
      const docs = await this.getAllSchedule();
      docs.forEach((doc) => {
        this.runSchedule(doc.group_id, doc.rule, doc.text);
      });
    } catch (e) {
      logger.error(e);
    } finally {
      logger.info('start all schedule');
    }
  }

  cancelSchedule(id) {
    const job = schedule.scheduledJobs[this.getScheduleName(id)];
    if (job) {
      job.cancel();
    }
  }

  async setSchedule(groupId, rule, text) {
    this.cancelSchedule(groupId);
    const { hours, days } = this.runSchedule(groupId, rule, text);
    const ruleString = `${hours.join(',')} ${days.join(',')}`;
    await this.saveSchedule(groupId, ruleString, text);
    return { hours, days };
  }

  async removeSchedule(groupId) {
    this.cancelSchedule(groupId);
    await this.deleteSchedule(groupId);
    return 0;
  }

  ruleToShownString(hours, days) {
    let result = '';

    if (days[0] === 6 && days.length === 2) {
      result = '每周末的';
    } else if (
      days[0] === 1 &&
      days.indexOf(6) === -1 &&
      days.indexOf(7) === -1 &&
      days.length === 5
    ) {
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
