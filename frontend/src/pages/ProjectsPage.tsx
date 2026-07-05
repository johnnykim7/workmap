// 프로젝트 목록 (/projects) — 유형·상태 필터 + 카드 그리드 + 생성 마법사.
// 워크스페이스 선택/생성/수정은 좌상단 스위처 + 선택 화면으로 일원화(CR-018) — 이 화면엔 WS UI 없음.
// 평상시: 선택된 WS로 스코프(BIZ-112). 화면에서 WS를 바꾸지 않고 스위처로 전환한다.
// 전체 보기(CR-045, WMP-WS-009): 스위처 "전체 보기"(?all=1) 진입 시 내 모든 WS 프로젝트를
//   WS별 그룹으로 나열(넓힘 모드). LNB는 직전 WS 유지, 이 화면 본문만 넓어진다.
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FolderKanban, LayoutGrid, Plus, SearchX } from 'lucide-react';
import { Button } from '@therecommerce/ds-ui';
import { PageHead } from '@/components/common/page-head';
import { EmptyState } from '@/components/common/empty-state';
import { ProjectCardGridSkeleton } from '@/components/common/skeletons';
import { useProjects } from '@/features/projects/hooks';
import { groupByWorkspace } from '@/features/projects/ws-group';
import { useWorkspaces } from '@/features/workspaces/hooks';
import { ProjectFilterBar } from '@/features/projects/components/ProjectFilterBar';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { ProjectCreateWizard } from '@/features/projects/components/ProjectCreateWizard';
import { useAuthStore } from '@/store/auth-store';
import { useWorkspaceStore } from '@/store/workspace-store';
import { ROUTES } from '@/lib/route-paths';
import type { ProjectFilter } from '@/features/projects/api';
import type { Project } from '@/types/domain';

export function ProjectsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // 전체 보기 모드(CR-045) — 스위처가 ?all=1로 진입. WS를 강제 주입하지 않아 내 모든 WS 프로젝트를 받는다.
  const allMode = searchParams.get('all') === '1';

  // 선택된 WS로 스코프(CR-018, BIZ-112) — 스위처가 정한 WS의 프로젝트만. BE도 멤버십으로 강제.
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const [filter, setFilter] = useState<ProjectFilter>({});
  const [wizardOpen, setWizardOpen] = useState(false);
  const role = useAuthStore((s) => s.user?.role);
  // 전체 모드에선 생성 비활성(어느 WS에 만들지 모호 — WS를 먼저 고르라고 유도).
  const canCreate = !allMode && (role === 'OWNER' || role === 'ADMIN' || role === 'MANAGER');

  // 전체 모드면 WS 미주입(내 모든 WS). 아니면 현재 WS로 강제. 유형/상태/검색만 사용자가 조정.
  const scopedFilter: ProjectFilter = allMode
    ? filter
    : currentWorkspaceId
      ? { ...filter, workspaceId: currentWorkspaceId }
      : filter;
  const { data: projects, isPending } = useProjects(scopedFilter);

  // 전체 모드의 WS별 그룹 헤더·카드 배지에 쓸 WS 이름 맵. 평상시엔 조회하지 않음.
  const { data: workspaces } = useWorkspaces();
  const wsName = useMemo(() => {
    const m = new Map<number, string>();
    workspaces?.forEach((w) => m.set(w.id, w.name));
    return m;
  }, [workspaces]);

  const patch = (p: Partial<ProjectFilter>) => setFilter((f) => ({ ...f, ...p }));

  const hasActiveFilter = useMemo(
    () => Boolean(filter.keyword || filter.templateId || filter.status),
    [filter],
  );

  // 전체 모드 카드 클릭: 그 프로젝트의 WS로 진입(setWorkspace) → 단일 스코프 복귀 후 이동.
  const openInWorkspace = (p: Project) => {
    setWorkspace(p.workspaceId);
    navigate(ROUTES.project(p.key));
  };

  // 전체 모드: WS별로 그룹핑(내 WS 목록 순서). 목록에 없는 WS(경계 케이스)는 뒤에.
  const groups = useMemo(() => {
    if (!allMode || !projects) return [];
    return groupByWorkspace(projects, workspaces?.map((w) => w.id) ?? [], wsName);
  }, [allMode, projects, workspaces, wsName]);

  return (
    <>
      <PageHead
        title={allMode ? '프로젝트 · 전체 워크스페이스' : '프로젝트'}
        desc={allMode ? '내 모든 워크스페이스의 프로젝트' : '유형·상태로 필터'}
        actions={
          allMode ? (
            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.projects)}>
              <LayoutGrid className="size-4" /> 현재 워크스페이스만 보기
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => setWizardOpen(true)} disabled={!canCreate}>
              <Plus className="size-4" /> 프로젝트 만들기
            </Button>
          )
        }
      />

      <ProjectFilterBar filter={filter} onChange={patch} />

      {isPending ? (
        <ProjectCardGridSkeleton />
      ) : !projects || projects.length === 0 ? (
        hasActiveFilter ? (
          <EmptyState
            icon={<SearchX className="size-6" />}
            title="조건에 맞는 프로젝트가 없습니다"
            description="필터를 조정해 다시 찾아보세요."
            action={<Button variant="ghost" size="sm" onClick={() => setFilter({})}>필터 초기화</Button>}
          />
        ) : (
          <EmptyState
            icon={<FolderKanban className="size-6" />}
            title="아직 프로젝트가 없습니다"
            description={allMode
              ? '속한 워크스페이스에 프로젝트가 없습니다.'
              : '첫 프로젝트를 만들어 업무를 시작하세요.'}
            action={
              canCreate ? (
                <Button variant="primary" size="sm" onClick={() => setWizardOpen(true)}>
                  <Plus className="size-4" /> 프로젝트 만들기
                </Button>
              ) : undefined
            }
          />
        )
      ) : allMode ? (
        // 전체 모드: WS별 그룹 섹션(평면 그리드로 쏟지 않음)
        <div className="flex flex-col gap-6">
          {groups.map((g) => (
            <section key={g.id}>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                {g.name}
                <span className="text-xs font-normal text-muted-foreground">({g.projects.length})</span>
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.projects.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    wsName={g.name}
                    onNavigate={openInWorkspace}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      <ProjectCreateWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </>
  );
}
