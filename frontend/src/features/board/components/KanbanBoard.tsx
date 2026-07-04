// 칸반 보드 — 컬럼 가로 스크롤 + DnD 오케스트레이션.
// 드롭 시: 같은 컬럼이면 무시, BLOCKED 컬럼이면 사유 모달 먼저(BIZ-005), 그 외엔 즉시 상태 전이.
// 전이는 useChangeStatus(낙관적+롤백)에 위임. 클릭과 구분 위해 8px 이동 후 드래그 활성.
import { useMemo, useState } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import type { BoardColumn } from '../api';
import { useChangeStatus } from '../hooks';
import { KanbanColumn } from './KanbanColumn';
import { WorkItemCard } from './WorkItemCard';
import { BlockReasonDialog } from './BlockReasonDialog';
import type { WorkItemResponse } from '@/types/domain';

// CR-039: 병렬 스프린트에서 그룹(스프린트 섹션)마다 이 컴포넌트를 렌더한다.
// 각 섹션은 독립 DnD 컨텍스트(같은 워크플로라 statusId가 섹션 간 동일 → 섞이면 안 됨).
interface Props {
  projectId: number;
  columns: BoardColumn[];
  assigneeName: (id?: number | null) => string | undefined;
  onCardClick?: (workItemId: number) => void;
}

interface PendingBlock {
  workItemId: number;
  toStatusId: number;
  item: WorkItemResponse;
}

export function KanbanBoard({ projectId, columns, assigneeName, onCardClick }: Props) {
  const changeStatus = useChangeStatus(projectId);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [activeCard, setActiveCard] = useState<WorkItemResponse | null>(null);
  const [pendingBlock, setPendingBlock] = useState<PendingBlock | null>(null);

  const cardById = useMemo(() => {
    const m = new Map<number, WorkItemResponse>();
    columns.forEach((c) => c.cards.forEach((card) => m.set(card.id, card)));
    return m;
  }, [columns]);

  function handleDragStart(e: DragStartEvent) {
    const id = e.active.data.current?.workItemId as number | undefined;
    setActiveCard(id != null ? cardById.get(id) ?? null : null);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveCard(null);
    const workItemId = e.active.data.current?.workItemId as number | undefined;
    const toStatusId = e.over?.data.current?.statusId as number | undefined;
    if (workItemId == null || toStatusId == null) return;

    const item = cardById.get(workItemId);
    if (!item || item.statusId === toStatusId) return; // 같은 컬럼 드롭 무시

    const target = columns.find((c) => c.statusId === toStatusId);
    if (target?.commonStatus === 'BLOCKED') {
      // BIZ-005: 막힘 전이는 사유 입력 먼저
      setPendingBlock({ workItemId, toStatusId, item });
      return;
    }
    changeStatus.mutate({ workItemId, toStatusId });
  }

  return (
    // 부모(PageShell 본문, bodyOwnsScroll)의 높이를 꽉 채워 Jira식 칸반 동작:
    // 컬럼 컨테이너가 뷰포트 높이만큼 차지하고, 보드는 가로 스크롤(overflow-x-auto)·
    // 각 컬럼 내부 카드만 세로 스크롤(KanbanColumn). h-full min-h-0로 높이 계약을 잇는다.
    <div className="flex h-full min-h-0 flex-col">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveCard(null)}
      >
        <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-2">
          {columns.map((col) => (
            <KanbanColumn key={col.statusId} column={col} assigneeName={assigneeName} onCardClick={onCardClick} />
          ))}
        </div>

        {/* dropAnimation=null: 드롭 시 오버레이가 출발점으로 되돌아가는 snap-back 애니메이션 제거.
            낙관적 업데이트로 카드는 이미 도착 컬럼에 그려지므로 잔상 없이 즉시 안착시킨다. */}
        <DragOverlay dropAnimation={null}>
          {activeCard ? (
            <div className="w-72 rotate-1">
              <WorkItemCard item={activeCard} assigneeName={assigneeName(activeCard.assigneeId)} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <BlockReasonDialog
        open={!!pendingBlock}
        itemTitle={pendingBlock?.item.title}
        busy={changeStatus.isPending}
        onCancel={() => setPendingBlock(null)}
        onConfirm={(reason) => {
          if (!pendingBlock) return;
          changeStatus.mutate(
            { workItemId: pendingBlock.workItemId, toStatusId: pendingBlock.toStatusId, blockReason: reason },
            { onSettled: () => setPendingBlock(null) },
          );
        }}
      />
    </div>
  );
}
