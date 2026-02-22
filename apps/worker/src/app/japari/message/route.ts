/**
 * POST /japari/message - 内部消息转发（如原神缓存更新）。
 */
import type { NextRequest } from 'next/server';
import Config from '@/config.js';
import { notifyAdminsOfError } from '@/utils/notify-admin-error.js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const base = ((Config as { NODE_URL?: string }).NODE_URL || '').replace(/\/$/, '');
    if (base && (body as { type?: string })?.type === 'genshinUpdate') {
      await fetch(`${base}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    }
    return new Response('ok', { headers: { 'Content-Type': 'text/plain' } });
  } catch (e) {
    notifyAdminsOfError(e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
