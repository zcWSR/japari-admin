'use client';

import { User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function SessionAvatarRing({
  avatarUrl,
  title,
  countdownProgress,
  countdownText
}: {
  avatarUrl: string;
  title: string;
  countdownProgress: number;
  countdownText: string;
}) {
  const ringColor =
    countdownProgress <= 0.2
      ? 'var(--destructive)'
      : countdownProgress <= 0.5
        ? 'var(--chart-2)'
        : 'var(--sidebar-primary)';
  const ringTrackColor = 'color-mix(in oklch, var(--sidebar-border) 72%, transparent)';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative h-10 w-10 shrink-0">
          <div
            className="absolute inset-0 rounded-full p-[3px]"
            style={{
              background: `conic-gradient(${ringColor} ${countdownProgress * 360}deg, ${ringTrackColor} 0deg)`
            }}
          >
            <Avatar className="h-full w-full rounded-full bg-sidebar">
              <AvatarImage src={avatarUrl} alt={title} />
              <AvatarFallback className="rounded-full">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>鉴权过期倒计时：{countdownText}</p>
      </TooltipContent>
    </Tooltip>
  );
}
