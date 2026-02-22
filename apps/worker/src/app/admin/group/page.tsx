'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getGroups } from '@/actions/groups';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type GroupItem = { groupId: string };

export default function AdminGroupListPage() {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    getGroups()
      .then((r) => {
        if ('error' in r && r.status === 403) setForbidden(true);
        else if ('groups' in r) setGroups(r.groups);
      })
      .catch(() => setForbidden(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-muted-foreground">加载中…</p>
      </main>
    );
  }

  if (forbidden) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-destructive">仅超管（ADMIN_SECRET）可访问此页。</p>
        <Link
          href="/admin"
          className="mt-4 inline-block text-primary underline-offset-4 hover:underline"
        >
          返回管理首页
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <Card>
        <CardHeader>
          <CardTitle>全部群</CardTitle>
          <CardDescription>从 KV 插件配置中汇总的群列表，点击进入该群管理页。</CardDescription>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <p className="text-muted-foreground">暂无群数据。</p>
          ) : (
            <ul className="space-y-2">
              {groups.map(({ groupId }) => (
                <li key={groupId}>
                  <Link
                    href={`/admin/group/${groupId}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    群 {groupId}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <p className="mt-4 text-sm text-muted-foreground">
        <Link href="/admin" className="text-primary underline-offset-4 hover:underline">
          返回管理首页
        </Link>
      </p>
    </main>
  );
}
