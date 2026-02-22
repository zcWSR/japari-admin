import { PluginConfigForm } from './plugin-config-form';

export default async function PluginConfigPage({
  params
}: {
  params: Promise<{ groupId: string; pluginName: string }>;
}) {
  const { groupId, pluginName } = await params;
  return <PluginConfigForm groupId={groupId} pluginName={pluginName} />;
}
