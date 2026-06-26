// 백로그 행(§6.1) — 스프린트/백로그 구역의 항목 한 줄. 드래그로 구역 이동(useDraggable).
// 표시: 유형·키·제목·우선순위·추정·담당자·상태. 색은 상태/우선순위/막힘 신호에만.
import { useDraggable } from '@dnd-kit/core';
import type { WorkItemResponse } from '@/types/domain';
import { isWorkItemDelayed } from '@/types/domain';
import { TypeBadge, PriorityBadge, StatusBadge, Avatar2 } from '@/components/badges';
import { GripVertical, CalendarClock } from 'lucide-react';

interface Props {
  item: WorkItemResponse;
  assigneeName?: string;
  onClick?: () => void;
}

export function BacklogRow({ item, assigneeName, onClick }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `bl-${item.id}`,
    data: { workItemId: item.id, sprintId: item.sprintId ?? null },
  });
  const delayed = isWorkItemDelayed(item);

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-2 border-b border-border bg-card px-2 py-1.5 last:border-b-0 hover:bg-muted/40 ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground active:cursor-grabbing"
        aria-label="드래그하여 이동"
      >
        <GripVertical className="size-4" />
      </button>

      <TypeBadge type={item.issueType} withLabel={false} />
      <span className="font-mono text-[11px] text-muted-foreground">{item.key}</span>

      <button onClick={onClick} className="min-w-0 flex-1 truncate text-left text-sm text-foreground hover:underline">
        {item.title}
      </button>

      {item.dueDate && (
        <span className={`inline-flex items-center gap-0.5 text-[11px] ${delayed ? 'font-medium text-red-600' : 'text-muted-foreground'}`}>
          <CalendarClock className="size-3" />
          {item.dueDate.slice(5).replace('-', '/')}
        </span>
      )}
      {item.storyPoints != null && (
        <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{item.storyPoints}</span>
      )}
      <PriorityBadge priority={item.priority} />
      <StatusBadge status={item.commonStatus} />
      <Avatar2 name={assigneeName} />
    </div>
  );
}
