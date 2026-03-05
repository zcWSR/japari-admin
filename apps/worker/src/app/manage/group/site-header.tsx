'use client';

import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

function getTitle(pathname: string): string {
  if (pathname.startsWith('/manage/group/op')) {
    return pathname === '/manage/group/op/groups' ? '全部群管理' : '超管工具';
  }

  const match = pathname.match(/^\/manage\/group\/(\d+)(?:\/|$)/);
  if (!match) return '群管理';

  if (pathname.includes('/plugin/')) return `群 ${match[1]} · 插件配置`;
  if (pathname.endsWith('/simulate')) return `群 ${match[1]} · 模拟消息`;
  return `群 ${match[1]} · 概览`;
}

export function SiteHeader() {
  const pathname = usePathname();
  const title = getTitle(pathname ?? '');

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium text-foreground">{title}</h1>
      </div>
    </header>
  );
}
