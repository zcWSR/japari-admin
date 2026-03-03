import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getAuth, requireAdminToken } from '@/lib/auth';

export default async function OpLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const auth = await getAuth(h.get('cookie'));
  if (!requireAdminToken(auth)) {
    redirect('/manage');
  }
  return <>{children}</>;
}
