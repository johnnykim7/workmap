// 백로그 구역(스프린트 1개 또는 백로그) — 드롭 타깃(useDroppable) + 헤더 + 항목 행 리스트.
// sprint=null이면 백로그 구역(헤더는 BacklogView가 별도로 그림).
import { useDroppable } from '@dnd-kit/core';
import type { BacklogSection } from '../api';
import { BacklogRow } from './BacklogRow';
import { EmptyState } from '@/components/common/empty-state';
import { Inbox } from 'lucide-react';

interface Props {
  section: BacklogSection;
  collapsed?: boolean;
  assigneeName: (id?: number | null) => string | undefined;
  onItemClick?: (workItemId: number) => void;
  emptyHint?: string;
  header?: React.ReactNode;
}

export function SprintSection({ section, collapsed, assigneeName, onItemClick, emptyHint, header }: Props) {
  // 드롭 id: 스프린트면 sp-{id}, 백로그면 sp-backlog. data.sprintId=null이면 백로그로 이동.
  const dropId = section.sprint ? `sp-${section.sprint.id}` : 'sp-backlog';
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
    data: { sprintId: section.sprint ? section.sprint.id : null },
  });

  return (
    <div className="rounded-md border border-border">
      {header}
      {!collapsed && (
        <div
          ref={setNodeRef}
          className={`min-h-12 ${isOver ? 'bg-primary/5 ring-1 ring-inset ring-primary/30' : ''}`}
        >
          {section.items.length === 0 ? (
            <div className="py-5">
              <EmptyState icon={<Inbox className="size-5" />} title="항목 없음" description={emptyHint ?? '여기로 항목을 끌어오세요'} />
            </div>
          ) : (
            section.items.map((item) => (
              <BacklogRow
                key={item.id}
                item={item}
                assigneeName={assigneeName(item.assigneeId)}
                onClick={onItemClick ? () => onItemClick(item.id) : undefined}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
