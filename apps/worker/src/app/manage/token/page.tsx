import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { TokenForm } from './token-form';

export default async function ManageTokenPage() {
  const h = await headers();
  const auth = await getAuth(h.get('cookie'));
  if (auth) {
    if (auth.isAdminToken) {
      redirect('/manage/group/op');
    }
    if (auth.groupId) {
      redirect(`/manage/group/${auth.groupId}`);
    }
  }
  return <TokenForm />;
}
