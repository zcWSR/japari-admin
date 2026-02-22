export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold tracking-tight">japari-admin</h1>
      <p className="mt-2 text-muted-foreground">
        请使用 QQ 群内{' '}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">!setting</code>{' '}
        获取管理链接，或使用管理员 token 访问{' '}
        <a href="/admin/op" className="text-primary underline-offset-4 hover:underline">
          /admin/op
        </a>
        。
      </p>
    </main>
  );
}
