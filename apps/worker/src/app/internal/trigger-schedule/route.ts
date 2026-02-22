/**
 * POST /internal/trigger-schedule - Node 到点触发。
 */
import type { NextRequest } from 'next/server';
import ScheduleService from '@/services/schedule-service.js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const groupId = (body as { groupId?: string })?.groupId;
    if (!groupId) {
      return Response.json({ error: 'missing groupId' }, { status: 400 });
    }
    await ScheduleService.triggerSendForGroup(String(groupId));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
