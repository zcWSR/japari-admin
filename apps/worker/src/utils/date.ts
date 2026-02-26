import { TZDate } from '@date-fns/tz';
import {
  formatDate,
  getDate,
  getDay,
  getHours,
  getMinutes,
  getMonth,
  getSeconds,
  getYear
} from 'date-fns';

export const TIMEZONE = 'Asia/Shanghai';

export function formatShangHaiTime(
  date = new Date(),
  formatStr = 'yyyy年MM月dd日 HH:mm:ss'
): string {
  return formatDate(new TZDate(date, TIMEZONE), formatStr);
}

export function getShangHaiTimeParts(date = new Date()) {
  const zonedDate = new TZDate(date, TIMEZONE);
  return {
    hours: getHours(zonedDate),
    minutes: getMinutes(zonedDate),
    seconds: getSeconds(zonedDate),
    year: getYear(zonedDate),
    month: getMonth(zonedDate) + 1,
    date: getDate(zonedDate),
    day: getDay(zonedDate)
  };
}

export default {
  formatShangHaiTime,
  getShangHaiTimeParts,
  TIMEZONE
};
