'use client';

import { EllipsisVertical, LogOut, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getSessionInfo, logout } from '@/actions/auth';
import { getGroupConfig, getGroupSidebarInfo, setGroupConfig } from '@/actions/group-config';
import {
  acquireGroupLock,
  heartbeatGroupLock,
  releaseGroupLock
} from '@/actions/group-lock';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
import { SessionAvatarRing } from './session-avatar-ring';

const OP_BASE = '/manage/group/op';
const LOCK_HEARTBEAT_MS = 15_000;

type PluginItem = { name: string; shortInfo: string; enabled: boolean };

function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h} h ${m} m ${sec} s`;
  if (m > 0) return `${m} m ${sec} s`;
  return `${sec} s`;
}

function OpNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={pathname === `${OP_BASE}/groups`}
          size="lg"
          className="px-4"
        >
          <Link href={`${OP_BASE}/groups`} onClick={onNavigate}>
            全部群
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === OP_BASE} size="lg" className="px-4">
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
          <SidebarMenuButton
            asChild
            size="lg"
            isActive={pathname === `${base}/simulate`}
            className="pl-4 pr-14"
          >
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
  const { isMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [groupSidebar, setGroupSidebar] = useState<{
    groupId: string;
    groupName: string | null;
    memberName: string | null;
    plugins: PluginItem[];
    isAdminToken: boolean;
  } | null>(null);
  const [sessionInfo, setSessionInfo] = useState<{
    qq: string;
    displayName: string | null;
    avatarUrl: string | null;
    isAdminToken: boolean;
    ttlSeconds: number;
    expiresAt: number;
  } | null>(null);
  const [countdownTick, setCountdownTick] = useState(() => Date.now());

  const isOp = pathname === OP_BASE || pathname?.startsWith(`${OP_BASE}/`);
  const groupMatch = pathname?.match(/^\/manage\/group\/(\d+)(?:\/|$)/);
  const groupId = groupMatch?.[1] ?? null;

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
    getSessionInfo().then((res) => {
      if ('error' in res) {
        setSessionInfo(null);
        return;
      }
      setSessionInfo({
        qq: res.qq,
        displayName: res.displayName,
        avatarUrl: res.avatarUrl,
        isAdminToken: res.isAdminToken,
        ttlSeconds: res.ttlSeconds,
        expiresAt: res.expiresAt
      });
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!groupId || isOp) return;
    let ended = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const handleBusy = () => {
      if (ended) return;
      ended = true;
      toast.error('有同群其他人正在使用中');
      router.push('/manage/token');
    };

    const start = async () => {
      const first = await acquireGroupLock(groupId);
      if ('error' in first) {
        if (first.error === 'busy') {
          handleBusy();
        } else {
          toast.error('服务异常');
        }
        return;
      }
      timer = setInterval(async () => {
        const beat = await heartbeatGroupLock(groupId);
        if ('error' in beat) {
          if (beat.error === 'busy') {
            handleBusy();
          } else {
            toast.error('服务异常');
          }
        }
      }, LOCK_HEARTBEAT_MS);
    };

    const onBeforeUnload = () => {
      navigator.sendBeacon(
        '/manage/lock/release',
        JSON.stringify({ groupId })
      );
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    start();

    return () => {
      ended = true;
      window.removeEventListener('beforeunload', onBeforeUnload);
      if (timer) clearInterval(timer);
      releaseGroupLock(groupId);
    };
  }, [groupId, isOp, router]);

  const handleNavigate = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const headerTitle = isOp
    ? '超管模式'
    : (groupSidebar?.groupName ?? '群信息加载中');
  const headerSubTitle = isOp ? 'manage/group/op' : `群号 ${groupId ?? '-'}`;
  const groupAvatarUrl = groupId ? `https://p.qlogo.cn/gh/${groupId}/${groupId}/100` : '';

  const footerTitle = isOp
    ? (sessionInfo?.displayName ?? '超管')
    : (sessionInfo?.displayName ??
      groupSidebar?.memberName ??
      (groupSidebar?.isAdminToken ? '超管' : '—'));

  const footerSubTitle = sessionInfo?.qq ?? '未登录';
  const ttlSeconds = Math.max(1, sessionInfo?.ttlSeconds ?? 1);
  const remainingSeconds = sessionInfo
    ? Math.max(0, Math.floor((sessionInfo.expiresAt - countdownTick) / 1000))
    : 0;
  const countdownProgress = Math.min(1, remainingSeconds / ttlSeconds);
  const countdownText = formatDuration(remainingSeconds);

  const handleLogout = async () => {
    await logout();
    toast.success('已登出');
    router.push('/manage/token');
  };

  return (
    <Sidebar variant="inset" collapsible={isMobile ? 'offcanvas' : 'none'}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="pointer-events-none min-h-14 data-[slot=sidebar-menu-button]:p-2!">
              <Avatar className="h-10 w-10 rounded-full">
                <AvatarImage src={groupAvatarUrl} alt={headerTitle} />
                <AvatarFallback className="rounded-full bg-sidebar-primary/15 text-sidebar-primary">
                  <ShieldCheck className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-snug">
                <span className="truncate font-semibold">{headerTitle}</span>
                <span className="truncate text-xs text-sidebar-foreground/70">{headerSubTitle}</span>
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
            <SidebarMenuButton size="lg" className="pr-10">
              <SessionAvatarRing
                avatarUrl={sessionInfo?.avatarUrl ?? ''}
                title={footerTitle}
                countdownProgress={countdownProgress}
                countdownText={countdownText}
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{footerTitle}</span>
                <span className="truncate text-xs text-sidebar-foreground/70">{footerSubTitle}</span>
              </div>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction
                  showOnHover={false}
                  className="right-2 top-1/2! size-8 -translate-y-1/2! rounded-md text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <EllipsisVertical className="h-5 w-5" />
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" className="w-36">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    登出
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
