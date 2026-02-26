import pino from 'pino';

const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

const logger = pino({
  level: isDev ? 'debug' : 'info',
  ...(isDev && typeof process !== 'undefined' && (process as NodeJS.Process).versions?.node
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss' }
        }
      }
    : {})
});

export function blockLog(
  content: string | string[],
  type: 'info' | 'debug' | 'warn' | 'error' = 'info',
  borderIcon = '#',
  paddingHeight = 3,
  paddingWidth = 3
): void {
  const lines = typeof content === 'string' ? [content] : content;
  const width = lines.reduce((max, line) => Math.max(max, line.length), 0) + paddingWidth * 2;
  const height = lines.length + paddingHeight * 2;
  const fullHeight = height + 2;
  for (let index = 0; index < fullHeight; index++) {
    let msg: string;
    if (index === 0 || index === fullHeight - 1) {
      msg = borderIcon.repeat(width + 2);
    } else if (index <= paddingHeight || index > height - paddingHeight) {
      msg = `${borderIcon}${' '.repeat(width)}${borderIcon}`;
    } else {
      const currentLine = lines[index - 1 - paddingHeight] ?? '';
      const paddingFloat = (width - currentLine.length) / 2;
      const padding = Math.ceil(paddingFloat);
      msg = `${borderIcon}${' '.repeat(
        padding - paddingFloat > 0 ? padding - 1 : padding
      )}${currentLine}${' '.repeat(padding)}${borderIcon}`;
    }
    (logger as pino.Logger)[type](msg);
  }
}

export default logger;
