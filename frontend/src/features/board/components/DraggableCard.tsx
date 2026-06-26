// 드래그 가능한 업무 카드 — @dnd-kit useDraggable로 WorkItemCard를 감싼다.
// 드래그 중엔 원본을 흐리게(DragOverlay가 실제 미리보기를 그린다).
import { useDraggable } from '@dnd-kit/core';
import type { WorkItemResponse } from '@/types/domain';
import { WorkItemCard } from './WorkItemCard';

interface Props {
  item: WorkItemResponse;
  assigneeName?: string;
  onClick?: () => void;
}

export function DraggableCard({ item, assigneeName, onClick }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `card-${item.id}`,
    data: { workItemId: item.id, statusId: item.statusId },
  });

  // 클릭(상세 열기)과 드래그 구분: dnd-kit이 작은 이동은 클릭으로 통과시킨다(activationConstraint).
  return (
    <div ref={setNodeRef} className={isDragging ? 'opacity-40' : ''}>
      <WorkItemCard
        item={item}
        assigneeName={assigneeName}
        dragHandleProps={{ ...attributes, ...listeners }}
        onClick={onClick}
      />
    </div>
  );
}
