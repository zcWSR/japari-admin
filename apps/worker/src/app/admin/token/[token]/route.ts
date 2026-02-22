/**
 * 一次性链接兑换 session：GET /admin/token/:token
 * 逻辑与原 worker admin-token 一致。
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { NextRequest } from 'next/server';
import Config from '@/config.js';
import KVService from '@/services/kv-service.js';

const ADMIN_TOKEN_KEY_PREFIX = 'admin-token:';
const ADMIN_SESSION_PREFIX = 'admin-session:';
const COOKIE_TOKEN_NAME = 'admin_token';
const SESSION_TTL = 60 * 60 * 24;

function getBase(request: NextRequest): string {
  const url = request.url;
  const base = (Config.ADMIN_BASE_URL as string)?.replace(/\/$/, '') || new URL(url).origin;
  return base;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const env = getCloudflareContext().env as {
    ADMIN_SECRET?: string;
    ADMIN_BASE_URL?: string;
  };
  const { token } = await params;
  const t = (token || '').trim();
  const base = getBase(request);

  if (
    (env.ADMIN_SECRET ?? Config.ADMIN_SECRET) &&
    t === (env.ADMIN_SECRET ?? Config.ADMIN_SECRET)
  ) {
    const res = new Response(null, {
      status: 302,
      headers: { Location: `${base}/admin/op` }
    });
    const secret = String(env.ADMIN_SECRET ?? Config.ADMIN_SECRET);
    res.headers.set(
      'Set-Cookie',
      `${COOKIE_TOKEN_NAME}=${encodeURIComponent(secret)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL}${base.startsWith('https') ? '; Secure' : ''}`
    );
    return res;
  }

  if (!t) {
    return Response.redirect(new URL('/admin?error=missing', request.url), 302);
  }

  const key = `${ADMIN_TOKEN_KEY_PREFIX}${t}`;
  const raw = await KVService.get(key);
  if (!raw) {
    return Response.redirect(new URL('/admin?error=expired', request.url), 302);
  }
  let data: { groupId?: string; adminId?: string; used?: boolean };
  try {
    data = JSON.parse(raw);
  } catch {
    return Response.redirect(new URL('/admin?error=invalid', request.url), 302);
  }
  if (data.used) {
    return Response.redirect(new URL('/admin?error=used', request.url), 302);
  }
  await KVService.set(key, JSON.stringify({ ...data, used: true }), 300);

  const sessionToken = crypto.randomUUID();
  await KVService.set(
    `${ADMIN_SESSION_PREFIX}${sessionToken}`,
    JSON.stringify({ groupId: data.groupId, adminId: data.adminId }),
    SESSION_TTL
  );
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${base}/admin/group/${data.groupId}`,
      'Set-Cookie': `${COOKIE_TOKEN_NAME}=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL}${base.startsWith('https') ? '; Secure' : ''}`
    }
  });
}
