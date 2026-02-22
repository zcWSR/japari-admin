'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getGroups } from '@/actions/groups';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type GroupItem = { groupId: string };

export default function OpGroupsPage() {
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
    return <p className="text-muted-foreground">加载中…</p>;
  }

  if (forbidden) {
    return <p className="text-destructive">仅超管（ADMIN_SECRET）可访问。</p>;
  }

  return (
    <div>
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
    </div>
  );
}
