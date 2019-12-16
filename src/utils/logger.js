import Path from 'path';
import log4js from 'log4js';
import { isDev } from './env';

const logPath = Path.resolve(__dirname, '../../../logs/japari-admin');

log4js.configure({
  appenders: {
    console: { type: 'console' },
    dateFile: {
      type: 'dateFile',
      pattern: `${isDev() ? 'dev.' : ''}yyyy-MM-dd.log`,
      alwaysIncludePattern: true,
      filename: logPath,
      compress: true,
      backup: 5
    }
  },
  categories: {
    dev: { appenders: ['console', 'dateFile'], level: 'debug' },
    default: { appenders: ['dateFile'], level: 'info' }
  }
});

const logger = log4js.getLogger(isDev() ? 'dev' : 'default');

export function blockLog(
  content,
  type = 'info',
  borderIcon = '#',
  paddingHeight = 3,
  paddingWidth = 3
) {
  if (typeof content === 'string') {
    content = [content];
  }
  const width = content.sort((a, b) => b - a)[0].length + paddingWidth * 2;
  const height = content.length + paddingHeight * 2;
  [...Array(height + 2)].forEach((line, index, instance) => {
    if (index === 0 || index === instance.length - 1) {
      logger[type](borderIcon.repeat(width + 2));
    } else if (index <= paddingHeight || index > height - paddingHeight) {
      logger[type](`${borderIcon}${' '.repeat(width)}${borderIcon}`);
    } else {
      const currentLine = content[index - 1 - paddingHeight];
      const paddingFloat = (width - currentLine.length) / 2;
      const padding = Math.ceil(paddingFloat);
      logger[type](
        `${borderIcon}${' '.repeat(
          padding - paddingFloat > 0 ? padding - 1 : padding
        )}${currentLine}${' '.repeat(padding)}${borderIcon}`
      );
    }
  });
}

export default logger;
