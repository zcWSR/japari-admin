import Link from 'next/link';

const ERROR_MESSAGES: Record<string, string> = {
  missing: '链接无效（缺少 token）',
  expired: '链接已过期，请重新在群内使用 !setting 获取新链接。',
  used: '该链接已使用过，请重新使用 !setting 获取新链接。',
  invalid: '链接数据无效，请重新获取链接。',
  kv: '服务暂不可用，请稍后再试。'
};

export default async function AdminHome({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorCode } = await searchParams;
  const errorMessage = errorCode ? (ERROR_MESSAGES[errorCode] ?? `未知错误：${errorCode}`) : null;

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold tracking-tight">管理后台</h1>
      {errorMessage && (
        <div
          className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive"
          role="alert"
        >
          {errorMessage}
        </div>
      )}
      <p className="mt-4 text-muted-foreground">
        请在 QQ 群内使用{' '}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">!setting</code>{' '}
        获取一次性配置链接（5 分钟内有效）。
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        <Link href="/" className="text-primary underline-offset-4 hover:underline">
          返回首页
        </Link>
      </p>
    </main>
  );
}
