// 칸반 컬럼 — 워크플로 상태 1개. 드롭 타깃(useDroppable). 헤더에 카드 수.
// 승인 게이트 컬럼(isApproval)·완료 컬럼(isDone)은 헤더에 표식.
import { useDroppable } from '@dnd-kit/core';
import type { BoardColumn } from '../api';
import { DraggableCard } from './DraggableCard';
import { EmptyState } from '@/components/common/empty-state';
import { Inbox, CheckCircle2, ShieldCheck } from 'lucide-react';

interface Props {
  column: BoardColumn;
  assigneeName: (id?: number | null) => string | undefined;
  onCardClick?: (workItemId: number) => void;
}

export function KanbanColumn({ column, assigneeName, onCardClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${column.statusId}`, data: { statusId: column.statusId } });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/40">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground">{column.label}</span>
          {column.isDone && <CheckCircle2 className="size-3.5 text-green-600" />}
          {column.isApproval && <ShieldCheck className="size-3.5 text-amber-600" />}
        </div>
        <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
          {column.cards.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-24 flex-1 flex-col gap-2 px-2 pb-3 transition-colors ${
          isOver ? 'rounded-b-lg bg-primary/5 ring-1 ring-inset ring-primary/30' : ''
        }`}
      >
        {column.cards.length === 0 ? (
          <div className="py-6">
            <EmptyState icon={<Inbox className="size-5" />} title="항목 없음" description="여기로 카드를 끌어오세요" />
          </div>
        ) : (
          column.cards.map((card) => (
            <DraggableCard
              key={card.id}
              item={card}
              assigneeName={assigneeName(card.assigneeId)}
              onClick={onCardClick ? () => onCardClick(card.id) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
