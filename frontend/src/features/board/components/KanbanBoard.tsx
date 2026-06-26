// 칸반 보드 — 컬럼 가로 스크롤 + DnD 오케스트레이션.
// 드롭 시: 같은 컬럼이면 무시, BLOCKED 컬럼이면 사유 모달 먼저(BIZ-005), 그 외엔 즉시 상태 전이.
// 전이는 useChangeStatus(낙관적+롤백)에 위임. 클릭과 구분 위해 8px 이동 후 드래그 활성.
import { useMemo, useState } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import type { BoardResponse } from '../api';
import { useChangeStatus } from '../hooks';
import { KanbanColumn } from './KanbanColumn';
import { WorkItemCard } from './WorkItemCard';
import { BlockReasonDialog } from './BlockReasonDialog';
import type { WorkItemResponse } from '@/types/domain';

interface Props {
  board: BoardResponse;
  assigneeName: (id?: number | null) => string | undefined;
  onCardClick?: (workItemId: number) => void;
}

interface PendingBlock {
  workItemId: number;
  toStatusId: number;
  item: WorkItemResponse;
}

export function KanbanBoard({ board, assigneeName, onCardClick }: Props) {
  const changeStatus = useChangeStatus(board.projectId);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [activeCard, setActiveCard] = useState<WorkItemResponse | null>(null);
  const [pendingBlock, setPendingBlock] = useState<PendingBlock | null>(null);

  const cardById = useMemo(() => {
    const m = new Map<number, WorkItemResponse>();
    board.columns.forEach((c) => c.cards.forEach((card) => m.set(card.id, card)));
    return m;
  }, [board]);

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

    const target = board.columns.find((c) => c.statusId === toStatusId);
    if (target?.commonStatus === 'BLOCKED') {
      // BIZ-005: 막힘 전이는 사유 입력 먼저
      setPendingBlock({ workItemId, toStatusId, item });
      return;
    }
    changeStatus.mutate({ workItemId, toStatusId });
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveCard(null)}
      >
        <div className="flex gap-3 overflow-x-auto pb-2">
          {board.columns.map((col) => (
            <KanbanColumn key={col.statusId} column={col} assigneeName={assigneeName} onCardClick={onCardClick} />
          ))}
        </div>

        <DragOverlay>
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
    </>
  );
}
