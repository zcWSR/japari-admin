import Link from 'next/link';

export default function GroupNotFound() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-lg font-semibold text-foreground">群不存在或无权访问</h2>
      <p className="text-sm text-muted-foreground">
        群号格式无效或该群不在配置列表中（可能已被删除）。
      </p>
      <Link
        href="/manage/group"
        className="text-primary underline-offset-4 hover:underline"
      >
        返回群列表
      </Link>
    </div>
  );
}
