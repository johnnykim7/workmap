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

/** 달린 리액션 칩만 렌더(Slack식 — 추가 버튼은 우상단 hover 툴바의 EmojiPicker가 담당). */
export function ReactionChips({ reactions, currentUserId, onToggle }: Props) {
  if (!reactions.length) return null;
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
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
    </div>
  );
}

/** 이모지 추가 피커 — 우상단 hover 툴바에 들어가는 버튼(고정 이모지 셋). */
export function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7" aria-label="리액션 추가">
          <SmilePlus className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-1">
        <div className="flex gap-0.5">
          {EMOJI_SET.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => onPick(e)}
              className="rounded px-1.5 py-1 text-base outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            >
              {e}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
