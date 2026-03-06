import type { NextRequest } from 'next/server';
import { getAuth } from '@/lib/auth';
import KVService from '@/services/kv-service';

type LockValue = {
  holderSessionId: string;
};

export async function POST(request: NextRequest) {
  const auth = await getAuth(request.headers.get('cookie'));
  if (!auth) return Response.json({ ok: true });

  let body: { groupId?: string } = {};
  try {
    body = (await request.json()) as { groupId?: string };
  } catch {
    return Response.json({ ok: true });
  }
  const groupId = String(body.groupId ?? '').trim();
  if (!/^\d+$/.test(groupId)) return Response.json({ ok: true });

  const key = `manage-lock:${groupId}`;
  const current = await KVService.getJSON<LockValue>(key);
  if (current?.holderSessionId === auth.sessionToken) {
    await KVService.delete(key);
  }
  return Response.json({ ok: true });
}
