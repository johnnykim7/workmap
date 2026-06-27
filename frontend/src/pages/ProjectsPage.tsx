// 프로젝트 목록 (/projects) — 워크스페이스·유형·상태 필터 + 카드 그리드 + 생성 마법사. Sprint 2.
import { useMemo, useState } from 'react';
import { FolderKanban, Plus, SearchX, Building2, Pencil } from 'lucide-react';
import { Button } from '@therecommerce/ds-ui';
import { PageHead } from '@/components/common/page-head';
import { EmptyState } from '@/components/common/empty-state';
import { ProjectCardGridSkeleton } from '@/components/common/skeletons';
import {
  useProjects,
} from '@/features/projects/hooks';
import {
  useWorkspaces, useCreateWorkspace, useUpdateWorkspace,
} from '@/features/workspaces/hooks';
import { WorkspaceDialog } from '@/features/workspaces/components/WorkspaceDialog';
import { ProjectFilterBar } from '@/features/projects/components/ProjectFilterBar';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { ProjectCreateWizard } from '@/features/projects/components/ProjectCreateWizard';
import { useAuthStore } from '@/store/auth-store';
import type { ProjectFilter } from '@/features/projects/api';
import type { Workspace } from '@/types/domain';
import type { WorkspaceRequest } from '@/features/workspaces/api';

export function ProjectsPage() {
  const [filter, setFilter] = useState<ProjectFilter>({});
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wsDialogOpen, setWsDialogOpen] = useState(false);
  const [editingWs, setEditingWs] = useState<Workspace | null>(null);
  const role = useAuthStore((s) => s.user?.role);
  const canCreate = role === 'OWNER' || role === 'ADMIN' || role === 'MANAGER';
  const canManageWs = role === 'OWNER' || role === 'ADMIN'; // 워크스페이스 생성/수정은 Admin/Owner(POL-004)

  const { data: projects, isPending } = useProjects(filter);
  const { data: workspaces = [] } = useWorkspaces();
  const createWs = useCreateWorkspace();
  const updateWs = useUpdateWorkspace();

  const selectedWs = workspaces.find((w) => w.id === filter.workspaceId) ?? null;

  const openCreateWs = () => { setEditingWs(null); setWsDialogOpen(true); };
  const openEditWs = (ws: Workspace) => { setEditingWs(ws); setWsDialogOpen(true); };
  const submitWs = (body: WorkspaceRequest) => {
    const onDone = { onSuccess: () => setWsDialogOpen(false) };
    if (editingWs) updateWs.mutate({ id: editingWs.id, body }, onDone);
    else createWs.mutate(body, onDone);
  };

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
          <div className="flex items-center gap-2">
            {canManageWs && (
              <Button variant="secondary" size="sm" onClick={openCreateWs}>
                <Building2 className="size-4" /> 워크스페이스 만들기
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={() => setWizardOpen(true)} disabled={!canCreate}>
              <Plus className="size-4" /> 프로젝트 만들기
            </Button>
          </div>
        }
      />

      <ProjectFilterBar filter={filter} workspaces={workspaces} onChange={patch} />

      {canManageWs && selectedWs && (
        <div className="mb-4 -mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>워크스페이스: <span className="font-medium text-foreground">{selectedWs.name}</span></span>
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openEditWs(selectedWs)}>
            <Pencil className="size-3.5" /> 수정
          </Button>
        </div>
      )}

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

      <WorkspaceDialog
        open={wsDialogOpen}
        onOpenChange={setWsDialogOpen}
        busy={createWs.isPending || updateWs.isPending}
        editing={editingWs}
        onSubmit={submitWs}
      />
    </>
  );
}
