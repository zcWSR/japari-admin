import pino from 'pino';

// Worker 环境无 fs/path，仅输出到 stdout（wrangler dev 会显示）
const logger = pino({
  level: typeof process !== 'undefined' && process.env?.NODE_ENV === 'dev' ? 'debug' : 'info'
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
