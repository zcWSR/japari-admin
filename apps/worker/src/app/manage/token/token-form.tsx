'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { verifySettingAccess } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ERROR_TEXT: Record<string, string> = {
  member_not_found: '群内未找到该成员',
  insufficient_role: '权限不足',
  busy: '有同群其他人正在使用中',
  service_error: '服务异常',
  invalid_input: '请输入正确的群号与 QQ 号'
};

export function TokenForm() {
  const [groupId, setGroupId] = useState('');
  const [qq, setQq] = useState('');
  const [initialError, setInitialError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('error') ?? '';
    setInitialError(code ? (ERROR_TEXT[code] ?? '服务异常') : null);
  }, []);

  const submit = () => {
    startTransition(async () => {
      const res = await verifySettingAccess({ groupId, qq });
      if (!res.ok) {
        toast.error(ERROR_TEXT[res.error] ?? '服务异常');
        return;
      }
      toast.success('鉴权成功，正在跳转');
      router.push(res.redirectTo);
    });
  };

  return (
    <main className="bg-linear-to-b from-background via-muted/40 to-background flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">群管理登录</CardTitle>
          {initialError ? <p className="text-center text-sm text-destructive">{initialError}</p> : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupId">群号（超管可留空）</Label>
            <Input
              id="groupId"
              inputMode="numeric"
              placeholder="请输入群号"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value.trim())}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qq">QQ 号</Label>
            <Input
              id="qq"
              inputMode="numeric"
              placeholder="请输入 QQ 号"
              value={qq}
              onChange={(e) => setQq(e.target.value.trim())}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" disabled={pending} onClick={submit}>
            {pending ? '鉴权中…' : '确认'}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
