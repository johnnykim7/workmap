// 회사홈 패널용 한 줄 미리보기 행(§9.2) — 막힘/지연/미배정 목록 공용.
// 행 클릭 → 업무 상세(/work-items/{key}). 색은 신호에만(타입/우선순위 배지, 지연=빨강, 막힘사유).
import { useNavigate } from 'react-router-dom';
import { CalendarClock, Ban } from 'lucide-react';
import { TypeBadge, PriorityBadge } from '@/components/badges';
import { ROUTES } from '@/lib/route-paths';
import { isWorkItemDelayed, type WorkItemResponse } from '@/types/domain';

function dueLabel(due?: string | null): string | null {
  if (!due) return null;
  const [, m, d] = due.split('-');
  return m && d ? `${m}/${d}` : due;
}

export function WorkItemMiniRow({ item }: { item: WorkItemResponse }) {
  const navigate = useNavigate();
  const delayed = isWorkItemDelayed(item);
  const due = dueLabel(item.dueDate);

  return (
    <button
      type="button"
      onClick={() => navigate(ROUTES.workItem(item.key))}
      className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/40"
    >
      <TypeBadge type={item.issueType} withLabel={false} />
      <span className="font-mono text-[11px] text-muted-foreground">{item.key}</span>
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{item.title}</span>

      {item.blockReason && (
        <span className="inline-flex max-w-[40%] items-center gap-0.5 truncate text-[11px] text-red-600">
          <Ban className="size-3 shrink-0" />
          <span className="truncate">{item.blockReason}</span>
        </span>
      )}

      <PriorityBadge priority={item.priority} />

      {due && (
        <span
          className={`inline-flex shrink-0 items-center gap-0.5 text-[11px] ${
            delayed ? 'font-medium text-red-600' : 'text-muted-foreground'
          }`}
        >
          <CalendarClock className="size-3" />
          {due}
        </span>
      )}
    </button>
  );
}
