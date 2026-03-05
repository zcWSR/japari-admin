'use client';

import { ShieldCheck, User2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getGroupConfig, getGroupSidebarInfo, setGroupConfig } from '@/actions/group-config';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
import { Switch } from '@/components/ui/switch';

const OP_BASE = '/manage/group/op';

type PluginItem = { name: string; shortInfo: string; enabled: boolean };

function OpNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === `${OP_BASE}/groups`}>
          <Link href={`${OP_BASE}/groups`} onClick={onNavigate}>
            全部群
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === OP_BASE}>
          <Link href={OP_BASE} onClick={onNavigate}>
            模拟消息
          </Link>
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
  onNavigate
}: {
  groupId: string;
  plugins: PluginItem[];
  isAdminToken: boolean;
  onPluginToggle?: (name: string, enabled: boolean) => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const base = `/manage/group/${groupId}`;

  const onToggle = async (name: string, next: boolean) => {
    const nextConfig = Object.fromEntries(
      plugins.map((p) => [p.name, p.name === name ? next : p.enabled])
    ) as Record<string, boolean>;
    const r = await setGroupConfig(groupId, nextConfig);
    if (!('error' in r)) {
      onPluginToggle?.(name, next);
      // router.refresh();
    }
  };

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === base} size="lg" className="flex px-4">
          <Link href={base} onClick={onNavigate}>
            概览
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      {plugins.length > 0 && (
        <SidebarMenuItem className="pointer-events-none">
          <SidebarMenuButton size="lg" className="px-4 text-sm text-sidebar-foreground/60">
            插件
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
      {plugins.map((p) => (
        <SidebarMenuItem key={p.name}>
          <SidebarMenuButton
            asChild
            size="lg"
            isActive={pathname === `${base}/plugin/${p.name}`}
            className="pl-4 pr-14"
          >
            <Link href={`${base}/plugin/${p.name}`} onClick={onNavigate}>
              <span className="truncate">{p.shortInfo}</span>
            </Link>
          </SidebarMenuButton>
          <SidebarMenuAction
            asChild
            className="right-3 top-1/2! w-auto -translate-y-1/2! p-0 hover:bg-transparent"
          >
            <div className="flex items-center">
              <Switch
                checked={p.enabled}
                onCheckedChange={(checked) => onToggle(p.name, checked)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </SidebarMenuAction>
        </SidebarMenuItem>
      ))}
      {isAdminToken && (
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={pathname === `${base}/simulate`}>
            <Link href={`${base}/simulate`} onClick={onNavigate}>
              模拟消息
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
    </>
  );
}

export function AppSidebar() {
  const { isMobile, open, setOpen, setOpenMobile } = useSidebar();
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
  const prevOpenRef = useRef(open);
  const openedFromCollapsedRef = useRef(false);

  const handlePluginToggle = (name: string, enabled: boolean) => {
    setGroupSidebar((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        plugins: prev.plugins.map((p) => (p.name === name ? { ...p, enabled } : p))
      };
    });
  };

  useEffect(() => {
    if (!groupId) {
      setGroupSidebar(null);
      return;
    }
    Promise.all([getGroupSidebarInfo(groupId), getGroupConfig(groupId)]).then(([info, config]) => {
      if ('error' in info || 'error' in config) {
        setGroupSidebar(null);
        return;
      }
      setGroupSidebar({
        groupId,
        groupName: info.groupName ?? null,
        memberName: info.memberName ?? null,
        plugins: config.plugins ?? [],
        isAdminToken: config.isAdminToken ?? false
      });
    });
  }, [groupId]);

  useEffect(() => {
    if (!isMobile && prevOpenRef.current === false && open === true) {
      openedFromCollapsedRef.current = true;
    }
    prevOpenRef.current = open;
  }, [isMobile, open]);

  const handleNavigate = () => {
    if (isMobile) {
      setOpenMobile(false);
      return;
    }
    if (openedFromCollapsedRef.current) {
      setOpen(false);
      openedFromCollapsedRef.current = false;
    }
  };

  const headerTitle = isOp
    ? '超管'
    : groupSidebar
      ? `群 ${groupSidebar.groupId}${groupSidebar.groupName ? ` · ${groupSidebar.groupName}` : ''}`
      : `群 ${groupId ?? ''}`;

  const footerTitle = isOp
    ? '超管'
    : (groupSidebar?.memberName ?? (groupSidebar?.isAdminToken ? '超管' : '—'));

  return (
    <Sidebar variant="inset" collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <div className="flex min-w-0 items-center gap-2">
                <ShieldCheck className="h-5 w-5 shrink-0" />
                <span className="block truncate text-base font-semibold">{headerTitle}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {isOp && <OpNav onNavigate={handleNavigate} />}
              {!isOp && groupId && !groupSidebar && (
                <SidebarMenuItem>
                  <SidebarMenuButton className="pointer-events-none text-sidebar-foreground/70">
                    加载中…
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {groupSidebar && (
                <GroupNav
                  groupId={groupSidebar.groupId}
                  plugins={groupSidebar.plugins}
                  isAdminToken={groupSidebar.isAdminToken}
                  onPluginToggle={handlePluginToggle}
                  onNavigate={handleNavigate}
                />
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="pointer-events-none justify-start text-xs text-sidebar-foreground/80">
              <User2 className="h-4 w-4" />
              {footerTitle}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
