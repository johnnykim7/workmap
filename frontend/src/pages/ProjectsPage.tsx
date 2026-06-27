// 프로젝트 목록 (/projects) — 유형·상태 필터 + 카드 그리드 + 생성 마법사.
// 워크스페이스 선택/생성/수정은 좌상단 스위처 + 선택 화면으로 일원화(CR-018) — 이 화면엔 WS UI 없음.
// 목록은 선택된 WS로 스코프(BIZ-112) — 화면에서 WS를 바꾸지 않고 스위처로 전환한다.
import { useMemo, useState } from 'react';
import { FolderKanban, Plus, SearchX } from 'lucide-react';
import { Button } from '@therecommerce/ds-ui';
import { PageHead } from '@/components/common/page-head';
import { EmptyState } from '@/components/common/empty-state';
import { ProjectCardGridSkeleton } from '@/components/common/skeletons';
import { useProjects } from '@/features/projects/hooks';
import { ProjectFilterBar } from '@/features/projects/components/ProjectFilterBar';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { ProjectCreateWizard } from '@/features/projects/components/ProjectCreateWizard';
import { useAuthStore } from '@/store/auth-store';
import { useWorkspaceStore } from '@/store/workspace-store';
import type { ProjectFilter } from '@/features/projects/api';

export function ProjectsPage() {
  // 선택된 WS로 스코프(CR-018, BIZ-112) — 스위처가 정한 WS의 프로젝트만. BE도 멤버십으로 강제.
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const [filter, setFilter] = useState<ProjectFilter>({});
  const [wizardOpen, setWizardOpen] = useState(false);
  const role = useAuthStore((s) => s.user?.role);
  const canCreate = role === 'OWNER' || role === 'ADMIN' || role === 'MANAGER';

  // WS는 항상 현재 선택 WS로 강제(화면 필터로 안 바꿈). 유형/상태/검색만 사용자가 조정.
  const scopedFilter: ProjectFilter = currentWorkspaceId
    ? { ...filter, workspaceId: currentWorkspaceId }
    : filter;
  const { data: projects, isPending } = useProjects(scopedFilter);

  const patch = (p: Partial<ProjectFilter>) => setFilter((f) => ({ ...f, ...p }));

  const hasActiveFilter = useMemo(
    () => Boolean(filter.keyword || filter.templateId || filter.status),
    [filter],
  );

  return (
    <>
      <PageHead
        title="프로젝트"
        desc="유형·상태로 필터"
        actions={
          <Button variant="primary" size="sm" onClick={() => setWizardOpen(true)} disabled={!canCreate}>
            <Plus className="size-4" /> 프로젝트 만들기
          </Button>
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
            description="첫 프로젝트를 만들어 업무를 시작하세요."
            action={
              canCreate ? (
                <Button variant="primary" size="sm" onClick={() => setWizardOpen(true)}>
                  <Plus className="size-4" /> 프로젝트 만들기
                </Button>
              ) : undefined
            }
          />
        )
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
