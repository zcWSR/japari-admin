'use client';

export function GroupOverview({ groupId }: { groupId: string }) {
  return (
    <div>
      <p className="text-muted-foreground">
        群 {groupId} 管理：左侧选择插件可查看与配置，开关已在列表中直接操作。
      </p>
    </div>
  );
}
