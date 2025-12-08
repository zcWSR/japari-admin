import { getHours, getMinutes, getSeconds, getYear, getMonth, getDate, getDay } from 'date-fns';
import { utcToZonedTime, formatInTimeZone } from 'date-fns-tz';

const TIMEZONE = 'Asia/Shanghai';

/**
 * 格式化时间为上海时区
 * @param {Date} date - 要格式化的日期
 * @param {string} formatStr - 格式化字符串
 * @returns {string} 格式化后的时间字符串
 */
export function formatShangHaiTime(date = new Date(), formatStr = 'yyyy年MM月dd日 HH:mm:ss') {
  return formatInTimeZone(date, TIMEZONE, formatStr);
}

/**
 * 获取上海时区的时间各部分
 * @param {Date} date - 要处理的日期
 * @returns {Object} 包含 hours, minutes, seconds, year, month, date, day
 */
export function getShangHaiTimeParts(date = new Date()) {
  // 将 UTC 时间转换为上海时区
  const zonedDate = utcToZonedTime(date, TIMEZONE);
  
  return {
    hours: getHours(zonedDate),
    minutes: getMinutes(zonedDate),
    seconds: getSeconds(zonedDate),
    year: getYear(zonedDate),
    month: getMonth(zonedDate) + 1, // date-fns 月份是 0-11，+1 变成 1-12
    date: getDate(zonedDate),
    day: getDay(zonedDate)
  };
}

export default {
  formatShangHaiTime,
  getShangHaiTimeParts,
  TIMEZONE
};
