'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getPluginConfig, setPluginConfig } from '@/actions/plugin-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type PageConfig = {
  title?: string;
  sections?: { title?: string; items: Record<string, unknown>[] }[];
};

export function PluginConfigForm({ groupId, pluginName }: { groupId: string; pluginName: string }) {
  const router = useRouter();
  const [config, setConfig] = useState<PageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPluginConfig(groupId, pluginName)
      .then((r) => {
        if ('error' in r) {
          const status = (r as { status?: number }).status;
          if (status === 401) setError('未授权，请重新登录');
          else if (status === 403) setError('无权限访问该群');
          else if (status === 404) setError('插件不存在');
          else setError((r as { error?: string }).error ?? '未授权或插件不存在');
        } else
          setConfig((r as { hasConfig?: boolean }).hasConfig === false ? null : (r as PageConfig));
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [groupId, pluginName]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const body: Record<string, string | string[]> = {};
    fd.forEach((v, k) => {
      const prev = body[k];
      if (prev === undefined) body[k] = v as string;
      else body[k] = Array.isArray(prev) ? [...prev, v as string] : [prev, v as string];
    });
    const r = await setPluginConfig(groupId, pluginName, body as Record<string, unknown>);
    if ('ok' in r && r.ok) router.refresh();
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="flex flex-col gap-2">
          <div className="h-4 w-full max-w-md animate-pulse rounded bg-muted" />
          <div className="h-10 w-full max-w-md animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }
  if (error) return <p className="text-destructive">{error}</p>;
  if (!config?.sections?.length) return <p className="text-muted-foreground">该插件暂无配置项。</p>;

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">{config.title ?? pluginName}</h1>
      <form onSubmit={handleSubmit} className="mt-4 space-y-6">
        {config.sections.map((section, i) => (
          <Card key={section.title ?? `section-${i}`}>
            <CardHeader>
              {section.title && <CardTitle className="text-base">{section.title}</CardTitle>}
            </CardHeader>
            <CardContent className="space-y-4">
              {section.items.map((item: Record<string, unknown>, j) => (
                <div key={String(item.id ?? `item-${j}`)} className="space-y-2">
                  {item.type === 'display' && (
                    <p className="text-sm text-muted-foreground">{(item.text as string) ?? ''}</p>
                  )}
                  {(item.type === 'text' || item.type === 'textarea') && (
                    <>
                      <Label htmlFor={String(item.id)}>
                        {(item.label as string) ?? (item.id as string)}
                      </Label>
                      {item.type === 'textarea' ? (
                        <Textarea
                          id={String(item.id)}
                          name={item.id as string}
                          defaultValue={(item.value as string) ?? (item.default as string)}
                          placeholder={(item.placeholder as string) ?? ''}
                          rows={5}
                          className="max-w-md"
                        />
                      ) : (
                        <Input
                          id={String(item.id)}
                          name={item.id as string}
                          defaultValue={(item.value as string) ?? (item.default as string)}
                          placeholder={(item.placeholder as string) ?? ''}
                          className="max-w-md"
                        />
                      )}
                    </>
                  )}
                  {item.type === 'button' && (
                    <Button type="submit" size="sm">
                      {(item.label as string) ?? '保存'}
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        <Button type="submit">保存</Button>
      </form>
    </div>
  );
}
