/**
 * 轻量 logger，零依赖，兼容 Edge/Worker（无 worker 线程、无 Node 独有 API）。
 * 通过环境变量 LOG_LEVEL 控制最低级别：debug | info | warn | error，默认 info。
 */

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type LevelName = keyof typeof LEVELS;

function getMinLevel(): number {
  if (typeof process === 'undefined' || !process.env?.LOG_LEVEL) return LEVELS.info;
  const v = process.env.LOG_LEVEL.toLowerCase() as LevelName;
  return LEVELS[v] ?? LEVELS.info;
}

const minLevel = getMinLevel();

function shouldLog(level: LevelName): boolean {
  return LEVELS[level] >= minLevel;
}

function formatArg(x: unknown): string {
  if (x instanceof Error) return x.stack ?? x.message;
  if (typeof x === 'object' && x !== null) return JSON.stringify(x);
  return String(x);
}

function formatMessage(msg: unknown, ...args: unknown[]): string[] {
  return [formatArg(msg), ...args.map(formatArg)];
}

const prefix = (level: LevelName) => `[${level}]`;

function log(level: LevelName, msg: unknown, ...args: unknown[]): void {
  if (!shouldLog(level)) return;
  const out = formatMessage(msg, ...args);
  switch (level) {
    case 'error':
      console.error(prefix(level), ...out);
      break;
    case 'warn':
      console.warn(prefix(level), ...out);
      break;
    case 'debug':
      console.debug(prefix(level), ...out);
      break;
    default:
      console.info(prefix(level), ...out);
  }
}

const logger = {
  debug(msg: unknown, ...args: unknown[]) {
    log('debug', msg, ...args);
  },
  info(msg: unknown, ...args: unknown[]) {
    log('info', msg, ...args);
  },
  warn(msg: unknown, ...args: unknown[]) {
    log('warn', msg, ...args);
  },
  error(msg: unknown, ...args: unknown[]) {
    log('error', msg, ...args);
  },
  log(msg: unknown, ...args: unknown[]) {
    log('info', msg, ...args);
  }
};

export function blockLog(
  content: string | string[],
  type: 'info' | 'debug' | 'warn' | 'error' = 'info',
  borderIcon = '#',
  paddingHeight = 3,
  paddingWidth = 3
): void {
  const lines = typeof content === 'string' ? [content] : content;
  const width =
    lines.reduce((max, line) => Math.max(max, line.length), 0) + paddingWidth * 2;
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
    logger[type](msg);
  }
}

export default logger;
