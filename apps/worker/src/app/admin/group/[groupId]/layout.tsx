import { Suspense } from 'react';
import { GroupContent } from './group-content';
import { Sidebar } from './sidebar';

function SidebarFallback({ groupId }: { groupId: string }) {
  return (
    <aside className="flex w-56 flex-col border-r border-sidebar-border bg-sidebar p-4">
      <h2 className="mb-2 text-sm font-semibold text-sidebar-foreground">群 {groupId}</h2>
      <div className="space-y-1">
        <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
      </div>
    </aside>
  );
}

export default async function GroupLayout({
  params
}: {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  return (
    <div className="flex min-h-screen">
      <Suspense fallback={<SidebarFallback groupId={groupId} />}>
        <Sidebar groupId={groupId} />
      </Suspense>
      <main className="flex-1 overflow-auto p-6">
        <GroupContent groupId={groupId} />
      </main>
    </div>
  );
}
