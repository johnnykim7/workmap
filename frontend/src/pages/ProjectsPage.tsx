// 프로젝트 목록 (/projects) — 워크스페이스·유형·상태 필터 + 카드 그리드 + 생성 마법사. Sprint 2.
import { useMemo, useState } from 'react';
import { FolderKanban, Plus, SearchX } from 'lucide-react';
import { Button } from '@therecommerce/ds-ui';
import { PageHead } from '@/components/common/page-head';
import { EmptyState } from '@/components/common/empty-state';
import { ProjectCardGridSkeleton } from '@/components/common/skeletons';
import { useProjects } from '@/features/projects/hooks';
import { useWorkspaces } from '@/features/workspaces/hooks';
import { ProjectFilterBar } from '@/features/projects/components/ProjectFilterBar';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { ProjectCreateWizard } from '@/features/projects/components/ProjectCreateWizard';
import { useAuthStore } from '@/store/auth-store';
import type { ProjectFilter } from '@/features/projects/api';

export function ProjectsPage() {
  const [filter, setFilter] = useState<ProjectFilter>({});
  const [wizardOpen, setWizardOpen] = useState(false);
  const role = useAuthStore((s) => s.user?.role);
  const canCreate = role === 'OWNER' || role === 'ADMIN' || role === 'MANAGER';

  const { data: projects, isPending } = useProjects(filter);
  const { data: workspaces = [] } = useWorkspaces();

  const patch = (p: Partial<ProjectFilter>) => setFilter((f) => ({ ...f, ...p }));

  const hasActiveFilter = useMemo(
    () => Boolean(filter.keyword || filter.workspaceId || filter.templateId || filter.status),
    [filter],
  );

  return (
    <>
      <PageHead
        title="프로젝트"
        desc="워크스페이스·유형·상태로 필터"
        actions={
          <Button variant="primary" size="sm" onClick={() => setWizardOpen(true)} disabled={!canCreate}>
            <Plus className="size-4" /> 프로젝트 만들기
          </Button>
        }
      />

      <ProjectFilterBar filter={filter} workspaces={workspaces} onChange={patch} />

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
