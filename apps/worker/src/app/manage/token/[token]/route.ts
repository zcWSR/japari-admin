/**
 * 一次性链接兑换 session：GET /manage/token/:token
 * 与手动输入页共享同一会话模型与锁逻辑。
 */
import type { NextRequest } from 'next/server';
import { acquireGroupLockWithSession } from '@/actions/group-lock';
import Config from '@/config';
import { getAvatarUrl, getSessionKey } from '@/lib/auth';
import KVService from '@/services/kv-service';
import QQService from '@/services/qq-service';

const ADMIN_TOKEN_KEY_PREFIX = 'admin-token:';
const COOKIE_TOKEN_NAME = 'admin_token';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const t = (token || '').trim();

  if (!t) {
    return Response.redirect(new URL('/manage/token?error=missing', request.url), 302);
  }

  const key = `${ADMIN_TOKEN_KEY_PREFIX}${t}`;
  const raw = await KVService.get(key);
  if (!raw) {
    return Response.redirect(new URL('/manage/token?error=expired', request.url), 302);
  }
  let data: { groupId?: string; adminId?: string; used?: boolean };
  try {
    data = JSON.parse(raw);
  } catch {
    return Response.redirect(new URL('/manage/token?error=invalid', request.url), 302);
  }
  if (data.used) {
    return Response.redirect(new URL('/manage/token?error=used', request.url), 302);
  }

  const groupId = String(data.groupId ?? '').trim();
  const qq = String(data.adminId ?? '').trim();
  if (!/^\d+$/.test(groupId) || !/^\d+$/.test(qq)) {
    return Response.redirect(new URL('/manage/token?error=invalid', request.url), 302);
  }

  const member = await QQService.getGroupMemberInfo(groupId, qq);
  if ('error' in member) {
    const reason = member.error === 'member_not_found' ? 'not_found' : 'service_error';
    return Response.redirect(new URL(`/manage/token?error=${reason}`, request.url), 302);
  }
  if (member.data.role !== 'admin' && member.data.role !== 'owner') {
    return Response.redirect(new URL('/manage/token?error=forbidden', request.url), 302);
  }

  const isAdminToken = Config.ADMINS.includes(Number(qq));
  const ttlSeconds = isAdminToken
    ? Config.MANAGE_SESSION_TTL_ADMIN
    : Config.MANAGE_SESSION_TTL_NORMAL;
  const now = Date.now();
  const expiresAt = now + ttlSeconds * 1000;
  const sessionToken = crypto.randomUUID();
  const sessionOk = await KVService.setJSON(
    getSessionKey(sessionToken),
    {
      groupId,
      adminId: qq,
      qq,
      isAdminToken,
      displayName: member.data.card || member.data.nickname || qq,
      avatarUrl: getAvatarUrl(qq),
      ttlSeconds,
      expiresAt,
      createdAt: now
    },
    ttlSeconds
  );
  if (!sessionOk) {
    return Response.redirect(new URL('/manage/token?error=service_error', request.url), 302);
  }
  const lock = await acquireGroupLockWithSession({
    groupId,
    holderSessionId: sessionToken,
    holderQq: qq,
    holderName: member.data.card || member.data.nickname || qq
  });
  if ('error' in lock) {
    await KVService.delete(getSessionKey(sessionToken));
    const reason = lock.error === 'busy' ? 'busy' : 'service_error';
    return Response.redirect(new URL(`/manage/token?error=${reason}`, request.url), 302);
  }

  await KVService.set(key, JSON.stringify({ ...data, used: true }), 300);
  const location = isAdminToken
    ? `${Config.HOST_BASE_URL}/manage/group/op`
    : `${Config.HOST_BASE_URL}/manage/group/${groupId}`;
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      'Set-Cookie': `${COOKIE_TOKEN_NAME}=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ttlSeconds}${Config.HOST_BASE_URL.startsWith('https') ? '; Secure' : ''}`
    }
  });
}
