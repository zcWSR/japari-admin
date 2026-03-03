'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { deleteGroupConfig, getGroups } from '@/actions/groups';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type GroupItem = { groupId: string };

export default function OpGroupsPage() {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getGroups()
      .then((r) => {
        if ('error' in r && r.status === 403) setForbidden(true);
        else if ('groups' in r) setGroups(r.groups);
      })
      .catch(() => setForbidden(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (groupId: string) => {
    setActionError(null);
    setDeletingId(groupId);
    const r = await deleteGroupConfig(groupId);
    if ('error' in r) {
      setActionError(`删除失败：${r.error}（${r.status ?? 500}）`);
      setDeletingId(null);
      return;
    }

    const refreshed = await getGroups();
    if ('error' in refreshed) {
      setActionError(`刷新列表失败：${refreshed.error}（${refreshed.status ?? 500}）`);
      setDeletingId(null);
      return;
    }

    setGroups(refreshed.groups);
    setDeletingId(null);
  };

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
          {actionError && <p className="mb-3 text-sm text-destructive">{actionError}</p>}
          {groups.length === 0 ? (
            <p className="text-muted-foreground">暂无群数据。</p>
          ) : (
            <ul className="space-y-2">
              {groups.map(({ groupId }) => (
                <li key={groupId} className="flex items-center justify-between gap-2">
                  <Link
                    href={`/manage/group/${groupId}`}
                    className="min-w-0 flex-1 text-primary underline-offset-4 hover:underline"
                  >
                    群 {groupId}
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="shrink-0">
                        删除
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确定删除该群的插件配置吗？</AlertDialogTitle>
                        <AlertDialogDescription>
                          删除后该群将不再出现在列表中，如需再次管理请重新通过 !setting 获取链接。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={deletingId === groupId}
                          onClick={() => handleDelete(groupId)}
                        >
                          {deletingId === groupId ? '删除中…' : '确定删除'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
