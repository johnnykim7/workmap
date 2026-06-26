// 워크플로 편집 (/admin/workflows, WMP-ADM-003) — OWNER/ADMIN. 좌: 워크플로 목록(CRUD), 우: 선택된 워크플로의 상태/전이.
// 시스템 워크플로(isSystem)는 수정/삭제·상태/전이 편집 불가. 데이터=실 BE /admin/workflows(+/statuses,/transitions).
import { useEffect, useState } from 'react';
import { Button, Badge, cn } from '@therecommerce/ds-ui';
import { Plus, Pencil, Trash2, GitBranch, AlertTriangle } from 'lucide-react';
import { PageHead } from '@/components/badges';
import { AdminTabs } from '@/features/admin/components/AdminTabs';
import { WorkflowNameDialog } from '@/features/admin/components/WorkflowNameDialog';
import { WorkflowDetailPanel } from '@/features/admin/components/WorkflowDetailPanel';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { BacklogSkeleton } from '@/components/common/skeletons';
import { useWorkflows, useWorkflowMutations } from '@/features/admin/hooks';
import type { WorkflowResponse, WorkflowRequest } from '@/features/admin/api';

export function WorkflowsPage() {
  const { data, isPending, isError } = useWorkflows(0, 100);
  const { create, update, remove } = useWorkflowMutations();

  const workflows = data?.items ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 첫 로드 시 첫 워크플로 자동 선택.
  useEffect(() => {
    if (selectedId == null && workflows.length > 0) setSelectedId(workflows[0].id);
  }, [workflows, selectedId]);

  const selected = workflows.find((w) => w.id === selectedId) ?? null;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WorkflowResponse | null>(null);
  const [deleting, setDeleting] = useState<WorkflowResponse | null>(null);

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(w: WorkflowResponse) { setEditing(w); setDialogOpen(true); }

  function submit(body: WorkflowRequest) {
    if (editing) {
      update.mutate({ id: editing.id, body }, { onSuccess: () => setDialogOpen(false) });
    } else {
      create.mutate(body, {
        onSuccess: (w) => { setDialogOpen(false); setSelectedId(w.id); },
      });
    }
  }
  function confirmDelete() {
    if (!deleting) return;
    remove.mutate(deleting.id, {
      onSuccess: () => {
        if (selectedId === deleting.id) setSelectedId(null);
        setDeleting(null);
      },
    });
  }

  return (
    <div>
      <AdminTabs />
      <PageHead
        title="워크플로"
        desc="상태/전이 화이트리스트 정의 (POL-001)"
        actions={
          <Button variant="primary" size="sm" className="gap-1" onClick={openCreate}>
            <Plus className="size-4" /> 워크플로 추가
          </Button>
        }
      />

      {isPending ? (
        <BacklogSkeleton sections={2} />
      ) : isError ? (
        <EmptyState
          icon={<AlertTriangle className="size-6" />}
          title="워크플로를 불러오지 못했습니다"
          description="잠시 후 다시 시도해 주세요."
        />
      ) : workflows.length === 0 ? (
        <EmptyState
          icon={<GitBranch className="size-6" />}
          title="워크플로가 없습니다"
          description="[워크플로 추가]로 첫 워크플로를 만들어 보세요."
        />
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* 좌: 워크플로 목록 */}
          <div className="w-full shrink-0 space-y-1.5 lg:w-72">
            {workflows.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setSelectedId(w.id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition-colors',
                  w.id === selectedId
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50',
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <GitBranch className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm font-medium">{w.name}</span>
                  {w.isSystem && <Badge variant="secondary">시스템</Badge>}
                </span>
                <span className="flex shrink-0 gap-0.5">
                  <Button
                    variant="ghost" size="sm" className="size-7 p-0"
                    disabled={w.isSystem}
                    onClick={(e) => { e.stopPropagation(); openEdit(w); }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="sm" className="size-7 p-0 text-destructive"
                    disabled={w.isSystem}
                    onClick={(e) => { e.stopPropagation(); setDeleting(w); }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </span>
              </button>
            ))}
          </div>

          {/* 우: 상세(상태/전이) */}
          <div className="min-w-0 flex-1 rounded-lg border border-border p-4">
            {selected ? (
              <>
                <div className="mb-4 flex items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">{selected.name}</h2>
                  {selected.isSystem && <Badge variant="secondary">시스템(읽기 전용)</Badge>}
                </div>
                <WorkflowDetailPanel workflow={selected} />
              </>
            ) : (
              <EmptyState title="워크플로를 선택하세요" description="좌측에서 워크플로를 선택하면 상태·전이가 표시됩니다." />
            )}
          </div>
        </div>
      )}

      <WorkflowNameDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        busy={create.isPending || update.isPending}
        onSubmit={submit}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="워크플로 삭제"
        description={deleting ? `'${deleting.name}' 워크플로를 삭제합니다. 상태·전이도 함께 사라집니다.` : ''}
        confirmLabel="삭제"
        busy={remove.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
