// 업무 카드 — 보드/백로그 공용 카드 표현(T3-3 §보드: 제목·담당자·우선순위·기한·막힘).
// 색은 신호에만(상태/우선순위/막힘 배지). 본문은 중립 톤(CLAUDE.md 색 절제).
import type { WorkItemResponse } from '@/types/domain';
import { isWorkItemDelayed } from '@/types/domain';
import { TypeBadge, PriorityBadge, Avatar2 } from '@/components/badges';
import { Flag, CalendarClock } from 'lucide-react';

interface Props {
  item: WorkItemResponse;
  assigneeName?: string;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  onClick?: () => void;
}

// 기한 표시(지연이면 빨강 강조). yyyy-mm-dd → mm/dd.
function dueLabel(due?: string | null): string | null {
  if (!due) return null;
  const [, m, d] = due.split('-');
  return m && d ? `${m}/${d}` : due;
}

export function WorkItemCard({ item, assigneeName, dragHandleProps, onClick }: Props) {
  const delayed = isWorkItemDelayed(item);
  const blocked = !!item.flagged; // CR-040: 막힘은 상태가 아니라 깃발
  const due = dueLabel(item.dueDate);

  return (
    <div
      {...dragHandleProps}
      onClick={onClick}
      className={`group rounded-md border bg-card p-2.5 text-left shadow-sm transition hover:shadow ${
        blocked ? 'border-red-200' : 'border-border'
      } ${onClick ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <TypeBadge type={item.issueType} withLabel={false} />
        <span className="font-mono text-[11px] text-muted-foreground">{item.key}</span>
      </div>

      <p className="mb-2 line-clamp-2 text-sm text-foreground">{item.title}</p>

      {blocked && (
        <div className="mb-1.5 flex items-center gap-1 text-[11px] text-red-600">
          <Flag className="size-3" />
          <span className="line-clamp-1">{item.blockReason ?? '막힘'}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={item.priority} />
          {item.storyPoints != null && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
              {item.storyPoints}
            </span>
          )}
          {due && (
            <span className={`inline-flex items-center gap-0.5 text-[11px] ${delayed ? 'font-medium text-red-600' : 'text-muted-foreground'}`}>
              <CalendarClock className="size-3" />
              {due}
            </span>
          )}
        </div>
        <Avatar2 name={assigneeName} />
      </div>
    </div>
  );
}
