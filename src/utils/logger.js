import Path from 'path';
import pino from 'pino';
import { isDev } from './env';

const logPath = Path.resolve(__dirname, '../../../logs/japari-admin');

// Pino logger 配置
const logger = pino({
  level: isDev() ? 'debug' : 'info',
  transport: isDev()
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-MM-dd HH:mm:ss',
          ignore: 'pid,hostname'
        }
      }
    : {
        targets: [
          {
            target: 'pino/file',
            level: 'info',
            options: {
              destination: `${logPath}/${isDev() ? 'dev.' : ''}${new Date().toISOString().split('T')[0]}.log`,
              mkdir: true
            }
          }
        ]
      }
});

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
    let msg = '';
    if (index === 0 || index === instance.length - 1) {
      msg = borderIcon.repeat(width + 2);
    } else if (index <= paddingHeight || index > height - paddingHeight) {
      msg = `${borderIcon}${' '.repeat(width)}${borderIcon}`;
    } else {
      const currentLine = content[index - 1 - paddingHeight];
      const paddingFloat = (width - currentLine.length) / 2;
      const padding = Math.ceil(paddingFloat);
      msg = `${borderIcon}${' '.repeat(
        padding - paddingFloat > 0 ? padding - 1 : padding
      )}${currentLine}${' '.repeat(padding)}${borderIcon}`;
    }
    logger[type](msg);
  });
}

export default logger;
