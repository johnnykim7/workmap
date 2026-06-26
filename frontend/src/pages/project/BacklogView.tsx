// 백로그 탭(§6.1) — 다중 스프린트 + 백로그 영역 공존. 드래그로 스프린트↔백로그 이동(낙관적+롤백).
// 스프린트 시작/완료(FSM 가드 경유). 데이터=실 BE GET /projects/{id}/backlog.
import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext, PointerSensor, useSensor, useSensors, closestCenter, type DragEndEvent,
} from '@dnd-kit/core';
import { Button } from '@therecommerce/ds-ui';
import { Plus, ListTodo, AlertTriangle } from 'lucide-react';
import { useProjectByKey } from '@/features/projects/hooks';
import {
  useBacklog, useChangeItemSprint, useCreateSprint, useStartSprint, useCompleteSprint,
} from '@/features/agile/hooks';
import { SprintSection } from '@/features/agile/components/SprintSection';
import { SprintHeader } from '@/features/agile/components/SprintHeader';
import { CreateSprintDialog } from '@/features/agile/components/CreateSprintDialog';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useAssigneeName } from '@/features/members/use-assignee-name';
import { BacklogSkeleton } from '@/components/common/skeletons';
import { EmptyState } from '@/components/common/empty-state';
import { ROUTES } from '@/lib/route-paths';
import type { Sprint } from '@/types/domain';

export function BacklogView() {
  const { key = '' } = useParams();
  const navigate = useNavigate();
  const { data: project, isPending: projectPending } = useProjectByKey(key);
  const projectId = project?.id;

  const { data: backlog, isPending, isError } = useBacklog(projectId);
  const assigneeName = useAssigneeName(projectId);

  const changeSprint = useChangeItemSprint(projectId ?? 0);
  const createSprint = useCreateSprint(projectId ?? 0);
  const startSprint = useStartSprint(projectId ?? 0);
  const completeSprint = useCompleteSprint(projectId ?? 0);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<Sprint | null>(null);

  // 진행 중 스프린트 존재 → FUTURE 시작 버튼 비활성(앞 스프린트 먼저 완료)
  const hasActive = useMemo(
    () => backlog?.sprints.some((s) => s.sprint?.status === 'ACTIVE') ?? false,
    [backlog],
  );

  if (projectPending || (projectId && isPending)) return <BacklogSkeleton />;

  if (isError) {
    return (
      <EmptyState
        icon={<AlertTriangle className="size-6" />}
        title="백로그를 불러오지 못했습니다"
        description="잠시 후 다시 시도해 주세요."
      />
    );
  }
  if (!backlog) return null;

  function handleDragEnd(e: DragEndEvent) {
    const workItemId = e.active.data.current?.workItemId as number | undefined;
    const fromSprintId = (e.active.data.current?.sprintId ?? null) as number | null;
    if (workItemId == null || !e.over) return;
    const toSprintId = (e.over.data.current?.sprintId ?? null) as number | null;
    if (fromSprintId === toSprintId) return; // 같은 구역
    changeSprint.mutate({ workItemId, sprintId: toSprintId });
  }

  const toggle = (id: string) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  return (
    <div>
      <div className="mb-3 flex items-center justify-end">
        <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          스프린트 만들기
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-4">
          {/* 스프린트 구역들 */}
          {backlog.sprints.map((section) => {
            const sid = `sp-${section.sprint!.id}`;
            return (
              <SprintSection
                key={sid}
                section={section}
                collapsed={collapsed[sid]}
                assigneeName={assigneeName}
                onItemClick={(id) => openItem(section.items, id)}
                emptyHint="여기로 항목을 끌어와 스프린트에 담으세요"
                header={
                  <SprintHeader
                    section={section}
                    collapsed={!!collapsed[sid]}
                    onToggle={() => toggle(sid)}
                    startDisabled={hasActive}
                    busy={startSprint.isPending || completeSprint.isPending}
                    onStart={(s) => startSprint.mutate({ sprintId: s.id })}
                    onComplete={(s) => setCompleteTarget(s)}
                  />
                }
              />
            );
          })}

          {/* 백로그 구역 */}
          <SprintSection
            section={backlog.backlog}
            assigneeName={assigneeName}
            onItemClick={(id) => openItem(backlog.backlog.items, id)}
            emptyHint="미계획 항목이 없습니다"
            header={
              <div className="flex items-center gap-3 rounded-t-md bg-muted/60 px-3 py-2">
                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <ListTodo className="size-4" />
                  백로그
                </div>
                <span className="text-xs text-muted-foreground">
                  {backlog.backlog.itemCount}건
                  {backlog.backlog.storyPointsSum > 0 ? ` · ${backlog.backlog.storyPointsSum}pt` : ''}
                </span>
              </div>
            }
          />
        </div>
      </DndContext>

      <CreateSprintDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        busy={createSprint.isPending}
        onSubmit={(body) =>
          createSprint.mutate(body, { onSuccess: () => setCreateOpen(false) })
        }
      />

      <ConfirmDialog
        open={!!completeTarget}
        onOpenChange={(o) => !o && setCompleteTarget(null)}
        title="스프린트 완료"
        description={`"${completeTarget?.name}"을(를) 완료합니다. 미완료 항목은 백로그로 이월됩니다.`}
        confirmLabel="완료하기"
        destructive={false}
        busy={completeSprint.isPending}
        onConfirm={() => {
          if (!completeTarget) return;
          completeSprint.mutate(
            { sprintId: completeTarget.id },
            { onSettled: () => setCompleteTarget(null) },
          );
        }}
      />
    </div>
  );

  function openItem(items: { id: number; key: string }[], id: number) {
    const it = items.find((i) => i.id === id);
    if (it) navigate(ROUTES.workItem(it.key));
  }
}
