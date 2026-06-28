// 백로그 구역(스프린트 1개 또는 백로그) — 드롭 타깃(useDroppable) + 헤더 + 항목 행 리스트 + 인라인 생성.
// sprint=null이면 백로그 구역(헤더는 BacklogView가 별도로 그림).
import { useDroppable } from '@dnd-kit/core';
import type { BacklogSection } from '../api';
import { BacklogRow } from './BacklogRow';
import { InlineCreateRow } from './InlineCreateRow';
import { EmptyState } from '@/components/common/empty-state';
import { Inbox } from 'lucide-react';

interface Props {
  section: BacklogSection;
  collapsed?: boolean;
  assigneeName: (id?: number | null) => string | undefined;
  onItemClick?: (workItemId: number) => void;
  emptyHint?: string;
  header?: React.ReactNode;
  // Epic 소속 칩(§6.1) — epicId → Epic 이름 해소. 없으면 칩 미표시.
  epicName?: (epicId?: number | null) => string | undefined;
  // 행에서 Epic 변경(§6.1) — 후보 + 핸들러. 있으면 칩이 드롭다운이 된다.
  epicOptions?: { id: number; title: string }[];
  onChangeEpic?: (workItemId: number, epicId: number | null) => void;
  // 인라인 생성(§6.1) — 이 구역에 항목 추가. busy면 입력 잠금. 미지정 시 + 만들기 행 숨김.
  onInlineCreate?: (title: string) => void;
  inlineBusy?: boolean;
}

export function SprintSection({
  section, collapsed, assigneeName, onItemClick, emptyHint, header, epicName,
  epicOptions, onChangeEpic, onInlineCreate, inlineBusy,
}: Props) {
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
                // Epic 자신에는 소속 칩/연결 드롭다운을 달지 않는다(자기 자신 표시 방지).
                epicName={item.issueType === 'EPIC' ? undefined : epicName?.(item.epicId)}
                epicOptions={item.issueType === 'EPIC' ? undefined : epicOptions}
                onChangeEpic={
                  item.issueType === 'EPIC' || !onChangeEpic
                    ? undefined
                    : (epicId) => onChangeEpic(item.id, epicId)
                }
              />
            ))
          )}
          {onInlineCreate && (
            <InlineCreateRow onCreate={onInlineCreate} busy={inlineBusy} />
          )}
        </div>
      )}
    </div>
  );
}
