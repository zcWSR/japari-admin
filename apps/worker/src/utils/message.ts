/**
 * 消息段工具类，用于 OneBot 11 协议消息段数组的处理
 */

import { type OB11MessageData, OB11MessageDataType } from '@/types/onebot11';

export type MessageInput = OB11MessageData[] | string;

/** 从消息段数组中提取第一个 text 段的文本内容 */
export function extractFirstText(message: MessageInput): string {
  if (typeof message === 'string') return message;
  if (!Array.isArray(message)) return '';
  const firstTextSeg = message.find((seg) => seg.type === OB11MessageDataType.text);
  return (firstTextSeg?.data as { text?: string } | undefined)?.text ?? '';
}

/** 从消息段数组中提取所有文本内容 */
export function extractAllText(message: MessageInput): string {
  if (typeof message === 'string') return message;
  if (!Array.isArray(message)) return '';
  return message
    .filter((seg) => seg.type === OB11MessageDataType.text)
    .map((seg) => (seg.data as { text: string }).text)
    .join('');
}

/** 构建文本消息段 */
export function text(content: string): OB11MessageData[] {
  return [{ type: OB11MessageDataType.text, data: { text: content } }];
}

/** 构建图片消息段 */
export function image(file: string, isBase64 = false): OB11MessageData[] {
  return [
    {
      type: OB11MessageDataType.image,
      data: { file: isBase64 ? `base64://${file}` : file }
    }
  ];
}

/** 构建 at 消息段 */
export function at(qq: string | number): OB11MessageData[] {
  return [{ type: OB11MessageDataType.at, data: { qq: String(qq) } }];
}

/** 合并多个消息段数组 */
export function concat(...segments: OB11MessageData[][]): OB11MessageData[] {
  return segments.flat();
}

/** 比较两个消息段是否相等（用于非文字段） */
export function isSegmentEqual(segA: OB11MessageData, segB: OB11MessageData): boolean {
  if (segA.type !== segB.type) return false;
  return JSON.stringify(segA.data) === JSON.stringify(segB.data);
}

/** 将消息格式化为可打印的字符串（用于日志） */
export function formatForLog(message: MessageInput): string {
  if (typeof message === 'string') return message;
  if (!Array.isArray(message)) return String(message);
  return message
    .map((seg) => {
      if (seg.type === OB11MessageDataType.text) return (seg.data as { text: string }).text;
      if (seg.type === OB11MessageDataType.image) return '[图片]';
      if (seg.type === OB11MessageDataType.at) return `[@${(seg.data as { qq: string }).qq}]`;
      if (seg.type === OB11MessageDataType.face) return `[表情:${(seg.data as { id: string }).id}]`;
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
