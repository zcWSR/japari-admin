import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="bg-linear-to-br from-sky-200 via-indigo-100 to-violet-200 flex min-h-svh items-center justify-center p-6 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="flex w-full max-w-2xl flex-col items-center gap-6 rounded-2xl border border-white/60 bg-white/60 p-10 shadow-xl backdrop-blur dark:border-white/10 dark:bg-slate-900/60">
        <h1 className="text-center text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          japari-admin
        </h1>
        <p className="text-center text-base text-slate-700 dark:text-slate-300">
          群插件管理控制台
        </p>
        <Button asChild size="lg" className="px-8">
          <Link href="/manage/token">群管理</Link>
        </Button>
      </div>
    </main>
  );
}
