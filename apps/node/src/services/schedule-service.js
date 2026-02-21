import schedule, { scheduleJob } from 'node-schedule';
import Config from '../config.js';
import logger from '../utils/logger.js';

/**
 * Node 端 ScheduleService：不直连 D1/QQ。
 * - 从 Worker GET /internal/schedules 拉取全量定时列表
 * - 到点向 Worker POST /internal/trigger-schedule { groupId }，由 Worker 查 D1 并发 QQ
 */
class ScheduleService {
  getScheduleName(groupId) {
    return `s-${groupId}`;
  }

  /** 从 Worker 拉取全量 schedule 列表，返回 [{ group_id, rule, text }, ...] */
  async fetchSchedulesFromWorker() {
    const base = (Config.workerUrl || '').replace(/\/$/, '');
    if (!base) {
      logger.warn('workerUrl not set, skip fetch schedules');
      return [];
    }
    const url = `${base}/internal/schedules`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Worker schedules failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : data.schedules || [];
  }

  /** 到点时通知 Worker 发送该群定时消息 */
  async triggerWorker(groupId) {
    const base = (Config.workerUrl || '').replace(/\/$/, '');
    if (!base) return;
    const url = `${base}/internal/trigger-schedule`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId: String(groupId) })
    });
    if (!res.ok) {
      logger.error('trigger-schedule failed for group %s: %s %s', groupId, res.status, res.statusText);
    }
  }

  getRuleFromString(ruleString) {
    let [hourString, dayString = 'everyday'] = (ruleString || '').split(' ');
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

  runSchedule(groupId, ruleString) {
    const { rule } = this.getRuleFromString(ruleString);
    const name = this.getScheduleName(groupId);
    const self = this;
    scheduleJob(name, { rule, tz: 'Asia/Shanghai' }, async () => {
      logger.info('schedule trigger group %s', groupId);
      await self.triggerWorker(groupId);
    });
    logger.info(`run schedule '${name}', rule '${rule}'`);
  }

  cancelSchedule(id) {
    const job = schedule.scheduledJobs[this.getScheduleName(id)];
    if (job) {
      job.cancel();
    }
  }

  /** 取消所有已注册的 schedule job */
  cancelAll() {
    const prefix = 's-';
    Object.keys(schedule.scheduledJobs || {}).forEach((name) => {
      if (name.startsWith(prefix)) {
        schedule.scheduledJobs[name].cancel();
      }
    });
  }

  /** 从 Worker 拉取列表并注册全部 node-schedule */
  async runAllSchedule() {
    try {
      const docs = await this.fetchSchedulesFromWorker();
      docs.forEach((doc) => {
        this.runSchedule(doc.group_id, doc.rule);
      });
      logger.info('start all schedule, count=%s', docs.length);
    } catch (e) {
      logger.error(e);
    }
  }

  /** 刷新：取消旧 job，重新从 Worker 拉取并注册 */
  async refresh() {
    this.cancelAll();
    await this.runAllSchedule();
  }
}

export default new ScheduleService();
