'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { setGroupConfig } from '@/actions/group-config';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type PluginItem = { name: string; shortInfo: string; enabled: boolean };

export function SidebarNav({
  groupId,
  plugins,
  isAdminToken
}: {
  groupId: string;
  plugins: PluginItem[];
  isAdminToken: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/manage/group/${groupId}`;

  const linkClass = (active: boolean) =>
    cn(
      'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
      active
        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
    );

  const onToggle = async (name: string, next: boolean) => {
    const nextConfig = Object.fromEntries(
      plugins.map((p) => [p.name, p.name === name ? next : p.enabled])
    ) as Record<string, boolean>;
    const r = await setGroupConfig(groupId, nextConfig);
    if (!('error' in r)) router.refresh();
  };

  return (
    <>
      <Link href={base} className={linkClass(pathname === base)}>
        概览
      </Link>
      {plugins.map((p) => (
        <div
          key={p.name}
          className={cn(
            'flex items-center gap-2 rounded-md pr-1',
            pathname === `${base}/plugin/${p.name}`
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )}
        >
          <Link
            href={`${base}/plugin/${p.name}`}
            className="min-w-0 flex-1 px-3 py-2 text-sm font-medium"
          >
            {p.shortInfo}
          </Link>
          <Switch
            checked={p.enabled}
            onCheckedChange={(checked) => onToggle(p.name, checked)}
            onClick={(e) => e.preventDefault()}
          />
        </div>
      ))}
      {isAdminToken && (
        <Link href={`${base}/simulate`} className={linkClass(pathname === `${base}/simulate`)}>
          模拟消息
        </Link>
      )}
    </>
  );
}
