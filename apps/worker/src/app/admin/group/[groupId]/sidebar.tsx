import { getGroupConfig } from '@/actions/group-config';
import { SidebarNav } from './sidebar-nav';

export async function Sidebar({ groupId }: { groupId: string }) {
  const result = await getGroupConfig(groupId);

  if ('error' in result) {
    return (
      <aside className="flex w-56 flex-col border-r border-sidebar-border bg-sidebar p-4">
        <h2 className="mb-2 text-sm font-semibold text-sidebar-foreground">群 {groupId}</h2>
        <p className="px-3 py-2 text-sm text-muted-foreground">未授权</p>
      </aside>
    );
  }

  const { plugins = [], isAdminToken = false } = result;
  return (
    <aside className="flex w-56 flex-col border-r border-sidebar-border bg-sidebar p-4">
      <h2 className="mb-2 text-sm font-semibold text-sidebar-foreground">群 {groupId}</h2>
      <nav className="space-y-1">
        <SidebarNav groupId={groupId} plugins={plugins} isAdminToken={isAdminToken} />
      </nav>
    </aside>
  );
}
