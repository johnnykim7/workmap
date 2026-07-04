// 보드 탭 — 스크럼(현재 스프린트)/운영(칸반 전체). 드래그로 상태 전이(T1-5 UI FSM: 낙관적+롤백).
// BLOCKED 드롭 시 차단 사유 모달 먼저(BIZ-005). 데이터=실 BE GET /projects/{id}/board.
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectByKey } from '@/features/projects/hooks';
import { useBoard } from '@/features/board/hooks';
import { KanbanBoard } from '@/features/board/components/KanbanBoard';
import { useAssigneeName } from '@/features/members/use-assignee-name';
import { BoardSkeleton } from '@/components/common/skeletons';
import { EmptyState } from '@/components/common/empty-state';
import { PageShell } from '@/components/common/page-shell';
import { ROUTES } from '@/lib/route-paths';
import { LayoutGrid, AlertTriangle } from 'lucide-react';

export function BoardView() {
  const { key = '' } = useParams();
  const navigate = useNavigate();
  const { data: project, isPending: projectPending } = useProjectByKey(key);
  const projectId = project?.id;

  const { data: board, isPending, isError } = useBoard(projectId);
  const assigneeName = useAssigneeName(projectId);

  if (projectPending || (projectId && isPending)) return <BoardSkeleton />;

  if (isError) {
    return (
      <EmptyState
        icon={<AlertTriangle className="size-6" />}
        title="보드를 불러오지 못했습니다"
        description="잠시 후 다시 시도해 주세요."
      />
    );
  }

  if (!board || board.columns.length === 0) {
    return (
      <EmptyState
        icon={<LayoutGrid className="size-6" />}
        title="보드 컬럼이 없습니다"
        description="이 프로젝트의 워크플로에 상태가 설정되어 있지 않습니다."
      />
    );
  }

  const cardTotal = board.columns.reduce((n, c) => n + c.cards.length, 0);
  if (cardTotal === 0) {
    return (
      <EmptyState
        icon={<LayoutGrid className="size-6" />}
        title="보드에 표시할 항목이 없습니다"
        description={board.sprintId ? '현재 스프린트에 항목이 없습니다.' : '아직 등록된 업무가 없습니다.'}
      />
    );
  }

  // 칸반은 자체 스크롤(컬럼 세로+보드 가로)이라 bodyOwnsScroll — PageShell은 높이만 채워준다(Jira식).
  return (
    <PageShell bodyOwnsScroll>
      <KanbanBoard
        board={board}
        assigneeName={assigneeName}
        onCardClick={(id) => {
          const card = board.columns.flatMap((c) => c.cards).find((c) => c.id === id);
          if (card) navigate(ROUTES.workItem(card.key));
        }}
      />
    </PageShell>
  );
}
