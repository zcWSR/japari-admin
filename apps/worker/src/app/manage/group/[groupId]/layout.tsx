import { notFound } from 'next/navigation';
import { GroupContent } from './group-content';
import PluginService from '@/services/plugin-service';

function isValidGroupId(groupId: string): boolean {
  return /^\d+$/.test(groupId) && groupId.length <= 20;
}

export default async function GroupLayout({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  if (!isValidGroupId(groupId)) {
    notFound();
  }

  const allIds = await PluginService.getAllGroupIds();
  if (!allIds.includes(groupId)) {
    notFound();
  }

  return <GroupContent groupId={groupId} />;
}
