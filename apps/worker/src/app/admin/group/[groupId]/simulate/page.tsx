import { SimulateForm } from './simulate-form';

export default async function SimulatePage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  return <SimulateForm groupId={groupId} />;
}
