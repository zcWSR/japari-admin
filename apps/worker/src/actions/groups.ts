'use server';

import { headers } from 'next/headers';
import { getAuth, requireAdminToken } from '@/lib/auth';
import PluginService from '@/services/plugin-service';

export type GroupsResult = { groups: { groupId: string }[] } | { error: string; status: number };

export async function getGroups(): Promise<GroupsResult> {
  const h = await headers();
  const auth = await getAuth(h.get('cookie'));
  if (!requireAdminToken(auth)) {
    return { error: 'forbidden', status: 403 };
  }
  const groupIds = await PluginService.getAllGroupIds();
  return { groups: groupIds.map((groupId) => ({ groupId })) };
}
