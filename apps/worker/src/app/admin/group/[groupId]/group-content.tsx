'use client';

import { usePathname } from 'next/navigation';
import { GroupOverview } from './group-overview';
import { PluginConfigForm } from './plugin/[pluginName]/plugin-config-form';
import { SimulateForm } from './simulate/simulate-form';

export function GroupContent({ groupId }: { groupId: string }) {
  const pathname = usePathname();
  const base = `/admin/group/${groupId}`;
  const isOverview = pathname === base;
  const isSimulate = pathname === `${base}/simulate`;
  const pluginMatch = pathname?.startsWith(`${base}/plugin/`)
    ? pathname.slice(`${base}/plugin/`.length).split('/')[0]
    : null;

  if (isOverview) return <GroupOverview groupId={groupId} />;
  if (isSimulate) return <SimulateForm groupId={groupId} />;
  if (pluginMatch) return <PluginConfigForm groupId={groupId} pluginName={pluginMatch} />;
  return null;
}
