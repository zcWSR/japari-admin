/**
 * 消息段工具类
 * 用于 OneBot 11 协议消息段数组的处理
 */

/**
 * 从消息段数组中提取第一个 text 段的文本内容
 * @param {Array|string} message 消息段数组或字符串
 * @returns {string} 文本内容
 */
export function extractFirstText(message) {
  if (typeof message === 'string') return message;
  if (!Array.isArray(message)) return '';
  const firstTextSeg = message.find((seg) => seg.type === 'text');
  return firstTextSeg?.data?.text || '';
}

/**
 * 从消息段数组中提取所有文本内容
 * @param {Array|string} message 消息段数组或字符串
 * @returns {string} 合并后的文本内容
 */
export function extractAllText(message) {
  if (typeof message === 'string') return message;
  if (!Array.isArray(message)) return '';
  return message
    .filter((seg) => seg.type === 'text')
    .map((seg) => seg.data.text)
    .join('');
}

/**
 * 构建文本消息段
 * @param {string} text 文本内容
 * @returns {Array} 消息段数组
 */
export function text(content) {
  return [{ type: 'text', data: { text: content } }];
}

/**
 * 构建图片消息段
 * @param {string} file 图片文件路径或 URL
 * @param {boolean} isBase64 是否为 base64 格式
 * @returns {Array} 消息段数组
 */
export function image(file, isBase64 = false) {
  return [{ type: 'image', data: { file: isBase64 ? `base64://${file}` : file } }];
}

/**
 * 构建 at 消息段
 * @param {string|number} qq QQ 号
 * @returns {Array} 消息段数组
 */
export function at(qq) {
  return [{ type: 'at', data: { qq: String(qq) } }];
}

/**
 * 合并多个消息段数组
 * @param  {...Array} segments 消息段数组
 * @returns {Array} 合并后的消息段数组
 */
export function concat(...segments) {
  return segments.flat();
}

/**
 * 比较两个消息段是否相等（用于非文字段）
 * @param {Object} segA 消息段 A
 * @param {Object} segB 消息段 B
 * @returns {boolean} 是否相等
 */
export function isSegmentEqual(segA, segB) {
  if (segA.type !== segB.type) return false;
  return JSON.stringify(segA.data) === JSON.stringify(segB.data);
}

/**
 * 将消息格式化为可打印的字符串（用于日志）
 * @param {Array|string} message 消息段数组或字符串
 * @returns {string} 格式化后的字符串
 */
export function formatForLog(message) {
  if (typeof message === 'string') return message;
  if (!Array.isArray(message)) return String(message);
  return message
    .map((seg) => {
      if (seg.type === 'text') return seg.data.text;
      if (seg.type === 'image') return '[图片]';
      if (seg.type === 'at') return `[@${seg.data.qq}]`;
      if (seg.type === 'face') return `[表情:${seg.data.id}]`;
      return `[${seg.type}]`;
    })
    .join('');
}

export default {
  extractFirstText,
  extractAllText,
  text,
  image,
  at,
  concat,
  isSegmentEqual,
  formatForLog
};

