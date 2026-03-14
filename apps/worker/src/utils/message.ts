/**
 * 消息段工具类，用于 OneBot 11 协议消息段数组的处理
 */

import type { OB11Segment } from '@/types/onebot11';

/** 从消息段数组中提取第一个 text 段的文本内容 */
export function extractFirstText(message: OB11Segment[]): string {
  const firstTextSeg = message.find((seg) => seg.type === 'text');
  return (firstTextSeg?.data as { text?: string } | undefined)?.text ?? '';
}

/** 从消息段数组中提取所有文本内容 */
export function extractAllText(message: OB11Segment[]): string {
  return message
    .filter((seg) => seg.type === 'text')
    .map((seg) => seg.data.text)
    .join('');
}

/** 构建文本消息段 */
export function text(content: string): OB11Segment[] {
  return [{ type: 'text', data: { text: content } }];
}

/** 构建图片消息段 */
export function image(file: string, isBase64 = false): OB11Segment[] {
  return [
    {
      type: 'image',
      data: { file: isBase64 ? `base64://${file}` : file }
    }
  ];
}

/** 构建 at 消息段 */
export function at(qq: string | number): OB11Segment[] {
  return [{ type: 'at', data: { qq: String(qq) } }];
}

/** 构建表情消息段 */
export function face(id: string): OB11Segment[] {
  return [{ type: 'face', data: { id } }];
}

export function music(id: string): OB11Segment[] {
  return [{ type: 'music', data: { type: '163', id } }];
}

/** 合并多个消息段数组 */
export function concat(...segments: OB11Segment[][]): OB11Segment[] {
  return segments.flat();
}

/** 比较两个消息段是否相等（用于非文字段） */
export function isSegmentEqual(segA: OB11Segment, segB: OB11Segment): boolean {
  if (segA.type !== segB.type) return false;
  const dataA = 'data' in segA ? segA.data : undefined;
  const dataB = 'data' in segB ? segB.data : undefined;
  return JSON.stringify(dataA) === JSON.stringify(dataB);
}

/** 将消息格式化为可打印的字符串（用于日志） */
export function formatForLog(message: OB11Segment[]): string {
  return message
    .map((seg) => {
      if (seg.type === 'text') return (seg.data as { text: string }).text;
      if (seg.type === 'image') return '[图片]';
      if (seg.type === 'at') return `[@${(seg.data as { qq: string }).qq}]`;
      if (seg.type === 'face') return `[表情:${(seg.data as { id: string }).id}]`;
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
