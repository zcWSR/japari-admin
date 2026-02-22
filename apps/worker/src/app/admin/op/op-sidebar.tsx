'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const base = '/admin/op';
const linkClass = (active: boolean) =>
  cn(
    'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
    active
      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
  );

export function OpSidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-56 flex-col border-r border-sidebar-border bg-sidebar p-4">
      <h2 className="mb-2 text-sm font-semibold text-sidebar-foreground">超管</h2>
      <nav className="space-y-1">
        <Link href={`${base}/groups`} className={linkClass(pathname === `${base}/groups`)}>
          全部群
        </Link>
        <Link href={base} className={linkClass(pathname === base)}>
          模拟消息
        </Link>
      </nav>
    </aside>
  );
}
