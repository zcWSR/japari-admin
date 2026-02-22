import pino from 'pino';

const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV === 'dev';

// dev 且 Node 环境用 pino-pretty 输出可读日志；Worker/生产保持 JSON 行
const logger = pino({
  level: isDev ? 'debug' : 'info',
  ...(isDev && typeof process !== 'undefined' && process.versions?.node
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss' }
        }
      }
    : {})
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
  [...Array(height + 2)].forEach((_line, index, instance) => {
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
