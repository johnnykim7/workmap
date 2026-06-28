// 백로그 행(§6.1) — 스프린트/백로그 구역의 항목 한 줄. 드래그로 구역 이동(useDraggable).
// 표시: 유형·키·제목·우선순위·추정·담당자·상태. 색은 상태/우선순위/막힘 신호에만.
import { useDraggable } from '@dnd-kit/core';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@therecommerce/ds-ui';
import type { WorkItemResponse } from '@/types/domain';
import { isWorkItemDelayed } from '@/types/domain';
import { TypeBadge, PriorityBadge, StatusBadge, Avatar2, EpicChip } from '@/components/badges';
import { GripVertical, CalendarClock, Layers } from 'lucide-react';

const NO_EPIC = '__no_epic__';

interface Props {
  item: WorkItemResponse;
  assigneeName?: string;
  onClick?: () => void;
  // Epic 소속 칩(§6.1) — 이 항목이 매달린 Epic 이름. Epic 자신/소속 없음이면 undefined.
  epicName?: string;
  // 행에서 직접 Epic 변경(§6.1, Jira식 인라인 연결). 후보 + 변경 핸들러가 있으면 칩이 드롭다운이 된다.
  epicOptions?: { id: number; title: string }[];
  onChangeEpic?: (epicId: number | null) => void;
}

export function BacklogRow({ item, assigneeName, onClick, epicName, epicOptions, onChangeEpic }: Props) {
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

      {/* Epic 연결(§6.1) — 변경 가능하면 드롭다운, 아니면 칩만. Epic 자신엔 표시 안 함(상위 호출부 제어). */}
      {onChangeEpic && epicOptions ? (
        <Select
          value={item.epicId != null ? String(item.epicId) : NO_EPIC}
          onValueChange={(v) => onChangeEpic(v === NO_EPIC ? null : Number(v))}
        >
          <SelectTrigger
            className="h-6 w-auto gap-1 border-none bg-transparent px-0 shadow-none focus:ring-0"
            aria-label="Epic 연결 변경"
          >
            {epicName ? (
              <EpicChip name={epicName} />
            ) : (
              <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted">
                <Layers className="size-3" /> Epic 지정
              </span>
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_EPIC}>없음</SelectItem>
            {epicOptions.map((e) => (
              <SelectItem key={e.id} value={String(e.id)}>{e.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        epicName && <EpicChip name={epicName} />
      )}

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
