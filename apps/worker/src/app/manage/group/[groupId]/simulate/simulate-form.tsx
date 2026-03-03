'use client';

import { useEffect, useState } from 'react';
import { type SentItem, simulateMessage } from '@/actions/simulate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const STORAGE_KEY_GROUP = 'simulate_group_id';
const STORAGE_KEY_USER = 'simulate_user_id';
const STORAGE_KEY_MSG = 'simulate_message';

/** groupId 可选：不传时（超管 op 页）显示 group_id 输入框 */
export function SimulateForm({ groupId: groupIdProp }: { groupId?: string }) {
  const [groupIdInput, setGroupIdInput] = useState('');
  const [message, setMessage] = useState('!help');
  const [userId, setUserId] = useState('0');
  const [result, setResult] = useState<string | null>(null);
  const [sent, setSent] = useState<SentItem[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setGroupIdInput(localStorage.getItem(STORAGE_KEY_GROUP) ?? '');
    setUserId(localStorage.getItem(STORAGE_KEY_USER) ?? '0');
    setMessage(localStorage.getItem(STORAGE_KEY_MSG) ?? '!help');
  }, []);

  const saveFormToStorage = () => {
    if (typeof window === 'undefined') return;
    if (groupIdProp == null) localStorage.setItem(STORAGE_KEY_GROUP, groupIdInput);
    localStorage.setItem(STORAGE_KEY_USER, userId);
    localStorage.setItem(STORAGE_KEY_MSG, message);
  };

  const groupId = groupIdProp ?? groupIdInput;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) {
      setResult('请填写 group_id');
      return;
    }
    setResult(null);
    setSent([]);
    const body = {
      post_type: 'message',
      message_type: 'group',
      group_id: groupId,
      user_id: userId,
      message,
      raw_message: message,
      sender: { user_id: userId, nickname: '模拟' }
    };
    const data = await simulateMessage(body);
    saveFormToStorage();
    if ('error' in data) {
      setResult(`错误: ${data.status} ${data.error}`);
      setSent([]);
    } else {
      setResult(data.results?.length ? JSON.stringify(data.results, null, 2) : null);
      setSent(data.sent ?? []);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>模拟消息</CardTitle>
          <CardDescription>仅管理员 token 可用，不走 QQ 流程，直接跑插件链。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="max-w-md space-y-4">
            {groupIdProp == null && (
              <div className="space-y-2">
                <Label htmlFor="simulate-group-id">group_id</Label>
                <Input
                  id="simulate-group-id"
                  value={groupIdInput}
                  onChange={(e) => setGroupIdInput(e.target.value)}
                  placeholder="群号"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="simulate-user-id">user_id</Label>
              <Input
                id="simulate-user-id"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="simulate-message">message</Label>
              <Input
                id="simulate-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="!help"
              />
            </div>
            <Button type="submit">发送</Button>
          </form>
          {sent.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">QQService 发送记录</p>
              <ul className="space-y-1 rounded-md border border-border bg-muted/30 p-3 text-sm">
                {sent.map((item, i) => (
                  <li
                    key={`${item.type}-${item.id}-${i}-${item.messagePreview.slice(0, 20)}`}
                    className="flex flex-wrap gap-2"
                  >
                    <span className="shrink-0 font-medium">
                      {item.type === 'group' ? `群 ${item.id}` : `私聊 ${item.id}`}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="min-w-0 break-words whitespace-pre-wrap">
                      {item.messagePreview || '(空)'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result && (
            <pre className="mt-4 overflow-auto rounded-md border border-border bg-muted/50 p-4 text-sm">
              {result}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
