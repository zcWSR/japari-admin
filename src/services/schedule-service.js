import moment from 'moment-timezone';
import schedule, { scheduleJob } from 'node-schedule';
import logger from '../utils/logger';
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
  db = null;
  setDBInstance(instance) {
    this.db = instance;
  }

  getAllSchedule() {
    return this.db('schedule').select('*');
  }

  async getScheduleNameByGroupId(groupId) {
    const meta = await this.db('schedule').first('name').where('group_id', groupId);
    if (!meta) return null;
    return meta.name;
  }

  getScheduleByGroupId(groupId) {
    return this.db('schedule').first().where('group_id', groupId);
  }

  getRuleFromString(ruleString) {
    // eslint-disable-next-line prefer-const
    let [hourString, dayString = 'everyday'] = ruleString.split(' ');
    let hours = hourString.split(',').reduce((result, hour) => {
      hour = parseInt(hour, 10);
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
      day = parseInt(day, 10);
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

  // function addZero(number, wantLength) {
  //   return `0000000000${number}`.slice(-wantLength);
  // }

  formatText(text) {
    const now = moment(new Date()).tz('Asia/Shanghai');
    return text
      .replace(/\\n/g, '\n')
      .replace(/\$\{hour\}/g, now.hours())
      .replace(/\$\{minute\}/g, now.minutes())
      .replace(/\$\{second\}/g, now.seconds())
      .replace(/\$\{year\}/g, now.year())
      .replace(/\$\{month\}/g, now.month() + 1)
      .replace(/\$\{date\}/g, now.date())
      .replace(/\$\{day\}/g, DAY_NAME_MAP[now.day()]);
  }

  sendText(groupId, text) {
    const formattedText = this.formatText(text);
    logger.info('auto sendText to', groupId, formattedText);
    QQService.sendGroupMessage(groupId, formattedText);
  }

  runSchedule(groupId, name, ruleString, text) {
    const { hours, days, rule } = this.getRuleFromString(ruleString);
    logger.info(`rule '${rule}'`);
    scheduleJob(
      name,
      { rule, tz: 'Asia/Shanghai' },
      this.sendText.bind(this, groupId, text)
    );
    return { hours, days };
  }

  async runAllSchedule() {
    try {
      const all = await this.getAllSchedule();
      // eslint-disable-next-line object-curly-newline
      all.forEach(({ group_id: groupId, name, rule: ruleString, text }) => {
        this.runSchedule(groupId, name, ruleString, text);
        logger.info(`run schedule '${name}'`);
      });
    } catch (e) {
      logger.error(e);
    } finally {
      logger.info('start all schedule');
    }
  }

  cancelSchedule(name) {
    const job = schedule.scheduledJobs[name];
    if (job) {
      job.cancel();
    }
  }

  async setSchedule(groupId, rule, text) {
    const name = await this.getScheduleNameByGroupId(groupId);
    if (name) {
      this.cancelSchedule(name);
    }
    const newName = `s-${groupId}`;
    const { hours, days } = this.runSchedule(groupId, newName, rule, text);
    if (name) {
      await this.db('schedule')
        .update({
          name: newName,
          rule: `${hours.join(',')} ${days.join(',')}`,
          text
        })
        .where('group_id', groupId);
    } else {
      await this.db('schedule').insert({
        group_id: groupId,
        name: newName,
        rule: `${hours.join(',')} ${days.join(',')}`,
        text
      });
    }
    return { hours, days };
  }

  async removeSchedule(groupId, name) {
    // const schedule = await getScheduleByGroupId(groupId);
    // if (!schedule) {
    //   return -1;
    // }
    this.cancelSchedule(name);
    await this.db('schedule').where('group_id', groupId).del();
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
