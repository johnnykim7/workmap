// 보드 탭 — 병렬 스프린트(CR-039): ACTIVE 스프린트별 아코디언 섹션 세로 나열.
// 드래그로 상태 전이(T1-5 UI FSM: 낙관적+롤백). BLOCKED 드롭 시 차단 사유 모달 먼저(BIZ-005).
// 데이터=실 BE GET /projects/{id}/board → { groups: [{ sprintId, sprintName, columns[] }] }.
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectByKey } from '@/features/projects/hooks';
import { useBoard } from '@/features/board/hooks';
import { KanbanBoard } from '@/features/board/components/KanbanBoard';
import { BoardAccordionSection } from '@/features/board/components/BoardAccordionSection';
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

  const groups = board?.groups ?? [];
  const hasColumns = groups.some((g) => g.columns.length > 0);
  if (!board || !hasColumns) {
    return (
      <EmptyState
        icon={<LayoutGrid className="size-6" />}
        title="보드 컬럼이 없습니다"
        description="이 프로젝트의 워크플로에 상태가 설정되어 있지 않습니다."
      />
    );
  }

  const cardTotal = groups.reduce((n, g) => n + g.columns.reduce((m, c) => m + c.cards.length, 0), 0);
  if (cardTotal === 0) {
    const scrum = groups.some((g) => g.sprintId != null);
    return (
      <EmptyState
        icon={<LayoutGrid className="size-6" />}
        title="보드에 표시할 항목이 없습니다"
        description={scrum ? '현재 스프린트에 항목이 없습니다.' : '아직 등록된 업무가 없습니다.'}
      />
    );
  }

  const onCardClick = (id: number) => {
    const card = groups.flatMap((g) => g.columns).flatMap((c) => c.cards).find((c) => c.id === id);
    if (card) navigate(ROUTES.workItem(card.key));
  };

  // 단일 그룹(운영형/스크럼 미시작/ACTIVE 1개) = 기존 UX: 칸반이 화면 전체를 채우고 자체 스크롤(bodyOwnsScroll).
  // sprintId가 있는 단일 스프린트도 헤더 없이 전체 화면 칸반(섹션 1개면 접기 UI가 불필요).
  if (groups.length === 1) {
    return (
      <PageShell bodyOwnsScroll>
        <KanbanBoard
          projectId={board.projectId}
          columns={groups[0].columns}
          assigneeName={assigneeName}
          onCardClick={onCardClick}
        />
      </PageShell>
    );
  }

  // 병렬 ACTIVE(그룹 2개 이상): 스프린트별 아코디언 섹션을 세로로 쌓는다(페이지 세로 스크롤).
  return (
    <PageShell>
      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <BoardAccordionSection
            key={group.sprintId}
            projectId={board.projectId}
            group={group}
            assigneeName={assigneeName}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </PageShell>
  );
}
