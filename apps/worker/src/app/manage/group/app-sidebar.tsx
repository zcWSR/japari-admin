'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  getGroupConfig,
  getGroupSidebarInfo,
  setGroupConfig,
} from '@/actions/group-config';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const OP_BASE = '/manage/group/op';

type PluginItem = { name: string; shortInfo: string; enabled: boolean };

function OpNav() {
  const pathname = usePathname();
  const linkClass = (active: boolean) =>
    cn(
      'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
      active
        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
    );
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === `${OP_BASE}/groups`}>
          <Link href={`${OP_BASE}/groups`}>全部群</Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === OP_BASE}>
          <Link href={OP_BASE}>模拟消息</Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
}

function GroupNav({
  groupId,
  plugins,
  isAdminToken,
  onPluginToggle,
}: {
  groupId: string;
  plugins: PluginItem[];
  isAdminToken: boolean;
  onPluginToggle?: (name: string, enabled: boolean) => void;
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
    if (!('error' in r)) {
      onPluginToggle?.(name, next);
      router.refresh();
    }
  };

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === base}>
          <Link href={base}>概览</Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      {plugins.map((p) => (
        <SidebarMenuItem key={p.name}>
          <div
            className={cn(
              'flex items-center gap-2 rounded-md pr-1',
              pathname === `${base}/plugin/${p.name}`
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <SidebarMenuButton asChild isActive={pathname === `${base}/plugin/${p.name}`}>
              <Link href={`${base}/plugin/${p.name}`} className="min-w-0 flex-1">
                {p.shortInfo}
              </Link>
            </SidebarMenuButton>
            <Switch
              checked={p.enabled}
              onCheckedChange={(checked) => onToggle(p.name, checked)}
              onClick={(e) => e.preventDefault()}
            />
          </div>
        </SidebarMenuItem>
      ))}
      {isAdminToken && (
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={pathname === `${base}/simulate`}>
            <Link href={`${base}/simulate`}>模拟消息</Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
    </>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [groupSidebar, setGroupSidebar] = useState<{
    groupId: string;
    groupName: string | null;
    memberName: string | null;
    plugins: PluginItem[];
    isAdminToken: boolean;
  } | null>(null);

  const isOp = pathname === OP_BASE || pathname?.startsWith(`${OP_BASE}/`);
  const groupMatch = pathname?.match(/^\/manage\/group\/(\d+)(?:\/|$)/);
  const groupId = groupMatch?.[1] ?? null;

  const handlePluginToggle = (name: string, enabled: boolean) => {
    setGroupSidebar((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        plugins: prev.plugins.map((p) =>
          p.name === name ? { ...p, enabled } : p
        ),
      };
    });
  };

  useEffect(() => {
    if (!groupId) {
      setGroupSidebar(null);
      return;
    }
    Promise.all([getGroupSidebarInfo(groupId), getGroupConfig(groupId)]).then(
      ([info, config]) => {
        if ('error' in info || 'error' in config) {
          setGroupSidebar(null);
          return;
        }
        setGroupSidebar({
          groupId,
          groupName: info.groupName ?? null,
          memberName: info.memberName ?? null,
          plugins: config.plugins ?? [],
          isAdminToken: config.isAdminToken ?? false,
        });
      }
    );
  }, [groupId]);

  return (
    <Sidebar collapsible="none">
      <SidebarHeader>
        <div className="flex flex-col gap-1 px-2 py-1.5 text-sm font-semibold text-sidebar-foreground">
          {isOp ? '超管' : groupSidebar ? `群 ${groupSidebar.groupId}${groupSidebar.groupName ? ` · ${groupSidebar.groupName}` : ''}` : `群 ${groupId ?? ''}`}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {isOp && <OpNav />}
              {!isOp && groupId && !groupSidebar && (
                <SidebarMenuItem>
                  <span className="px-3 py-2 text-sm text-muted-foreground">加载中…</span>
                </SidebarMenuItem>
              )}
              {groupSidebar && (
                <GroupNav
                  groupId={groupSidebar.groupId}
                  plugins={groupSidebar.plugins}
                  isAdminToken={groupSidebar.isAdminToken}
                  onPluginToggle={handlePluginToggle}
                />
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 py-1.5 text-xs text-sidebar-foreground/80">
          {isOp ? '超管' : groupSidebar?.memberName ?? (groupSidebar?.isAdminToken ? '超管' : '—')}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
