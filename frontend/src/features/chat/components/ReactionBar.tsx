// 리액션 칩 + 이모지 피커(고정 셋). 칩 클릭/피커 선택 모두 토글.
// 색 절제: 내가 누른 리액션만 옅은 강조(primary), 나머지는 중립 톤.
import { Button, Popover, PopoverContent, PopoverTrigger, cn } from '@therecommerce/ds-ui';
import { SmilePlus } from 'lucide-react';
import { EMOJI_SET, type ReactionSummary } from '../types';

interface Props {
  reactions: ReactionSummary[];
  currentUserId?: number;
  onToggle: (emoji: string) => void;
}

export function ReactionBar({ reactions, currentUserId, onToggle }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {reactions.map((r) => {
        const mine = currentUserId != null && r.userIds?.includes(currentUserId);
        return (
          <button
            key={r.emoji}
            type="button"
            onClick={() => onToggle(r.emoji)}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
              mine
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border bg-muted/40 text-foreground hover:bg-muted',
            )}
          >
            <span>{r.emoji}</span>
            <span className="tabular-nums">{r.count}</span>
          </button>
        );
      })}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="size-6" aria-label="리액션 추가">
            <SmilePlus className="size-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-1">
          <div className="flex gap-0.5">
            {EMOJI_SET.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => onToggle(e)}
                className="rounded px-1.5 py-1 text-base outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              >
                {e}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
