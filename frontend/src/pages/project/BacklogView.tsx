// 백로그 탭(§6.1) — 다중 스프린트 + 백로그 영역 공존. 드래그로 스프린트↔백로그 이동(낙관적+롤백).
// 스프린트 시작/완료(FSM 가드 경유). 데이터=실 BE GET /projects/{id}/backlog.
import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext, PointerSensor, useSensor, useSensors, pointerWithin, type DragEndEvent,
} from '@dnd-kit/core';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '@therecommerce/ds-ui';
import { Plus, ListTodo, AlertTriangle, ListOrdered, Layers, History } from 'lucide-react';
import { useProjectByKey } from '@/features/projects/hooks';
import {
  useBacklog, useChangeItemSprint, useCreateSprint, useStartSprint, useCompleteSprint,
  useUpdateSprint, useDeleteSprint,
} from '@/features/agile/hooks';
import { useCanWrite } from '@/lib/permissions';
import { useProjectItems, useCreateWorkItem, useChangeEpic } from '@/features/workitem/hooks';
import { filterByEpic } from '@/features/agile/epic-filter';
import { groupByEpic } from '@/features/agile/epic-group';
import { epicColor } from '@/features/agile/epic-color';
import { SprintSection } from '@/features/agile/components/SprintSection';
import { SprintHeader } from '@/features/agile/components/SprintHeader';
import { EpicGroupHeader } from '@/features/agile/components/EpicGroupHeader';
import { CreateSprintDialog } from '@/features/agile/components/CreateSprintDialog';
import { EditSprintDialog } from '@/features/agile/components/EditSprintDialog';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useAssigneeName } from '@/features/members/use-assignee-name';
import { BacklogSkeleton } from '@/components/common/skeletons';
import { EmptyState } from '@/components/common/empty-state';
import { PageShell } from '@/components/common/page-shell';
import { ROUTES } from '@/lib/route-paths';
import { PROJECT_TEMPLATES, type Sprint, type IssueType } from '@/types/domain';

export function BacklogView() {
  const { key = '' } = useParams();
  const navigate = useNavigate();
  const { data: project, isPending: projectPending } = useProjectByKey(key);
  const projectId = project?.id;

  // 완료 스프린트 보기(CR-041) — off(기본)면 완료 제외, on이면 ?includeCompleted=true로 재조회.
  const [showCompleted, setShowCompleted] = useState(false);
  const { data: backlog, isPending, isError } = useBacklog(projectId, showCompleted);
  const assigneeName = useAssigneeName(projectId);

  // Epic 소속 칩·필터용 — 프로젝트 항목 전체에서 EPIC만 추려 epicId→이름 맵 구성(신규 BE 없이 재사용).
  const { data: projectItems = [] } = useProjectItems(projectId);
  const epics = useMemo(() => projectItems.filter((w) => w.issueType === 'EPIC'), [projectItems]);
  const epicNameById = useMemo(() => {
    const m = new Map<number, string>();
    epics.forEach((e) => m.set(e.id, e.title));
    return m;
  }, [epics]);
  const epicName = (id?: number | null) => (id != null ? epicNameById.get(id) : undefined);

  // Epic 필터(§6.1) — 선택 시 해당 Epic 소속 항목만(Epic 자신은 항상 표시 유지). 'ALL'=전체.
  const [epicFilter, setEpicFilter] = useState<string>('ALL');

  // 보기 토글(CR-036) — 'priority'(우선순위순, 기본) ↔ 'epic'(Epic별 그룹). 백로그 영역만 그룹핑.
  const [viewMode, setViewMode] = useState<'priority' | 'epic'>('priority');
  // Epic 그룹 접기 상태(CR-036) — key=epicId 문자열('none'=미지정). 기본 펼침.
  const [groupCollapsed, setGroupCollapsed] = useState<Record<string, boolean>>({});
  const toggleGroup = (gid: string) =>
    setGroupCollapsed((c) => ({ ...c, [gid]: !c[gid] }));

  const changeSprint = useChangeItemSprint(projectId ?? 0);
  const createSprint = useCreateSprint(projectId ?? 0);
  const startSprint = useStartSprint(projectId ?? 0);
  const completeSprint = useCompleteSprint(projectId ?? 0);
  const updateSprint = useUpdateSprint(projectId ?? 0);
  const deleteSprint = useDeleteSprint(projectId ?? 0);
  const canWrite = useCanWrite();
  const createItem = useCreateWorkItem();
  const changeEpic = useChangeEpic(projectId);

  // 행에서 직접 Epic 연결 변경(§6.1) — 후보 목록 + 핸들러. 칩 클릭→드롭다운.
  const epicOptions = useMemo(() => epics.map((e) => ({ id: e.id, title: e.title })), [epics]);
  const onChangeEpic = (workItemId: number, epicId: number | null) =>
    changeEpic.mutate({ workItemId, epicId });

  // 행 … 메뉴로 스프린트 이동/백로그 되돌리기 — 드래그 조준 부담 없이 클릭으로.
  // 완료 스프린트는 이동 대상에서 제외(진행 가능한 구역만). 되돌리기=sprintId:null.
  const sprintOptions = useMemo(
    () => (backlog?.sprints ?? [])
      .filter((s) => s.sprint && s.sprint.status !== 'COMPLETED')
      .map((s) => ({ id: s.sprint!.id, name: s.sprint!.name })),
    [backlog],
  );
  const onMoveToSprint = (workItemId: number, sprintId: number | null) =>
    changeSprint.mutate({ workItemId, sprintId });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<Sprint | null>(null);
  const [editTarget, setEditTarget] = useState<Sprint | null>(null);      // CR-038 편집
  const [deleteTarget, setDeleteTarget] = useState<Sprint | null>(null);  // CR-038 삭제

  // 인라인 생성 기본 유형 — 템플릿 issueTypeCodes 중 STORY>TASK>첫 항목 순. EPIC/SUBTASK는 백로그 인라인 부적합.
  const defaultIssueType = useMemo<IssueType>(() => {
    const codes = (PROJECT_TEMPLATES.find((t) => t.id === project?.templateId)?.issueTypeCodes ?? []) as IssueType[];
    return codes.find((c) => c === 'STORY') ?? codes.find((c) => c === 'TASK')
      ?? codes.find((c) => c !== 'EPIC' && c !== 'SUBTASK') ?? 'TASK';
  }, [project]);

  // 진행 중 스프린트 존재 → FUTURE 시작 버튼 비활성(앞 스프린트 먼저 완료)
  const hasActive = useMemo(
    () => backlog?.sprints.some((s) => s.sprint?.status === 'ACTIVE') ?? false,
    [backlog],
  );

  // 구역 인라인 생성(§6.1) — 스프린트 구역이면 sprintId 프리필(BE CreateRequest 지원).
  // Epic 컨텍스트 상속: 명시 epicId(Epic별 그룹) > Epic 필터 > 없음. projectId·기본유형·제목만(가볍게).
  const inlineCreate = (sprintId: number | null, groupEpicId?: number | null) => (title: string) => {
    if (!projectId) return;
    const epicId = groupEpicId != null ? groupEpicId : (epicFilter !== 'ALL' ? Number(epicFilter) : null);
    createItem.mutate({ projectId, issueType: defaultIssueType, title, sprintId, epicId });
  };

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

  // Epic 필터를 적용한 구역(items만 교체). 다른 메타(itemCount 등)는 표시용이라 원본 유지.
  const withFilter = <T extends { items: typeof projectItems }>(section: T): T =>
    ({ ...section, items: filterByEpic(section.items, epicFilter) });

  const header = (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {/* Epic 필터(§6.1) — 큰 묶음(Epic) 단위로 좁혀 보기. Epic이 없으면 숨김. */}
        {epics.length > 0 && (
          <Select value={epicFilter} onValueChange={setEpicFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Epic 필터" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">모든 Epic</SelectItem>
              {epics.map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>{e.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {/* 보기 토글(CR-036) — 우선순위순 ↔ Epic별. Epic이 있어야 의미 있어 없으면 숨김. */}
        {epics.length > 0 && (
          <div className="inline-flex overflow-hidden rounded-md border border-border" role="group" aria-label="백로그 보기 전환">
            <button
              type="button"
              onClick={() => setViewMode('priority')}
              aria-pressed={viewMode === 'priority'}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium ${
                viewMode === 'priority' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              <ListOrdered className="size-3.5" /> 우선순위순
            </button>
            <button
              type="button"
              onClick={() => setViewMode('epic')}
              aria-pressed={viewMode === 'epic'}
              className={`inline-flex items-center gap-1 border-l border-border px-2.5 py-1.5 text-xs font-medium ${
                viewMode === 'epic' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              <Layers className="size-3.5" /> Epic별
            </button>
          </div>
        )}
        {/* 완료 스프린트 보기 토글(CR-041) — 켜면 완료 스프린트를 맨 위·접힌 채·읽기전용으로 함께 표시. */}
        <label className="ml-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <History className="size-3.5" />
          완료 스프린트 보기
          <Switch checked={showCompleted} onCheckedChange={setShowCompleted} />
        </label>
      </div>
      <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
        <Plus className="size-4" />
        스프린트 만들기
      </Button>
    </div>
  );

  return (
    <PageShell header={header}>
      {/* pointerWithin: 커서 위치 기준 충돌 판정 — Epic별 그룹으로 백로그가 쪼개져도 커서가 올라간 구역에 정확히 드롭(closestCenter는 중심점 거리라 그룹 사이 여백에서 오조준). */}
      <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-4">
          {/* 스프린트 구역들 — 완료(CR-041)는 맨 위·읽기전용·기본 접힘. */}
          {backlog.sprints.map((section) => {
            const sid = `sp-${section.sprint!.id}`;
            const isCompleted = section.sprint!.status === 'COMPLETED';
            // 완료 구역은 기본 접힘(사용자가 명시 토글 전엔 undefined) — 참고용. 진행/예정은 기본 펼침.
            const isCollapsed = collapsed[sid] ?? isCompleted;
            return (
              <SprintSection
                key={sid}
                section={withFilter(section)}
                collapsed={isCollapsed}
                readOnly={isCompleted}
                assigneeName={assigneeName}
                epicName={epicName}
                epicOptions={epicOptions}
                onChangeEpic={isCompleted ? undefined : onChangeEpic}
                sprintOptions={sprintOptions}
                onMoveToSprint={isCompleted ? undefined : onMoveToSprint}
                onItemClick={(id) => openItem(section.items, id)}
                onInlineCreate={isCompleted ? undefined : inlineCreate(section.sprint!.id)}
                inlineBusy={createItem.isPending}
                emptyHint="여기로 항목을 끌어와 스프린트에 담으세요"
                header={
                  <SprintHeader
                    section={section}
                    collapsed={isCollapsed}
                    onToggle={() => toggle(sid)}
                    startDisabled={hasActive}
                    busy={startSprint.isPending || completeSprint.isPending}
                    onStart={(s) => startSprint.mutate({ sprintId: s.id })}
                    onComplete={(s) => setCompleteTarget(s)}
                    canWrite={canWrite}
                    onEdit={(s) => setEditTarget(s)}
                    onDelete={(s) => setDeleteTarget(s)}
                  />
                }
              />
            );
          })}

          {/* 백로그 구역 — 우선순위순(평면) 또는 Epic별(그룹) (CR-036) */}
          {viewMode === 'priority' ? (
            <SprintSection
              section={withFilter(backlog.backlog)}
              assigneeName={assigneeName}
              epicName={epicName}
              epicOptions={epicOptions}
              onChangeEpic={onChangeEpic}
              sprintOptions={sprintOptions}
              onMoveToSprint={onMoveToSprint}
              onItemClick={(id) => openItem(backlog.backlog.items, id)}
              onInlineCreate={inlineCreate(null)}
              inlineBusy={createItem.isPending}
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
          ) : (
            // Epic별 그룹 보기(CR-036) — 백로그 영역 항목을 epicId로 묶어 그룹 헤더(접기/펼치기) + 소속 항목.
            // Epic 필터가 걸려 있으면 그 필터도 함께 적용(교집합). 각 그룹은 SprintSection 재사용(드롭 타깃=백로그 동일).
            groupByEpic(filterByEpic(backlog.backlog.items, epicFilter), epics.map((e) => e.id)).map((group) => {
              const gid = group.epicId != null ? `e-${group.epicId}` : 'e-none';
              const gName = group.epicId != null ? (epicName(group.epicId) ?? `Epic #${group.epicId}`) : 'Epic 미지정';
              return (
                <SprintSection
                  key={gid}
                  // itemCount/storyPointsSum는 그룹 헤더에서 안 쓰므로 원본 유지, items만 그룹으로 교체.
                  section={{ ...backlog.backlog, items: group.items }}
                  dropIdOverride={`sp-backlog-${gid}`}
                  collapsed={groupCollapsed[gid]}
                  assigneeName={assigneeName}
                  epicName={epicName}
                  epicOptions={epicOptions}
                  onChangeEpic={onChangeEpic}
                  sprintOptions={sprintOptions}
                  onMoveToSprint={onMoveToSprint}
                  onItemClick={(id) => openItem(backlog.backlog.items, id)}
                  onInlineCreate={inlineCreate(null, group.epicId)}
                  inlineBusy={createItem.isPending}
                  emptyHint="이 Epic에 항목이 없습니다"
                  header={
                    <EpicGroupHeader
                      name={gName}
                      color={group.epicId != null ? epicColor(group.epicId) : undefined}
                      count={group.items.length}
                      collapsed={!!groupCollapsed[gid]}
                      onToggle={() => toggleGroup(gid)}
                    />
                  }
                />
              );
            })
          )}
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

      {/* 스프린트 편집(CR-038) — 어느 상태든. status 무변경. */}
      <EditSprintDialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        sprint={editTarget}
        busy={updateSprint.isPending}
        onSubmit={(body) => {
          if (!editTarget) return;
          updateSprint.mutate(
            { sprintId: editTarget.id, body },
            { onSuccess: () => setEditTarget(null) },
          );
        }}
      />

      {/* 스프린트 삭제(CR-038) — FUTURE만(…메뉴에서 이미 제한). 담긴 항목 백로그 복귀. */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="스프린트 삭제"
        description={`"${deleteTarget?.name}"을(를) 삭제합니다. 담긴 항목은 백로그로 되돌아갑니다. 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제하기"
        busy={deleteSprint.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteSprint.mutate(deleteTarget.id, { onSettled: () => setDeleteTarget(null) });
        }}
      />
    </PageShell>
  );

  function openItem(items: { id: number; key: string }[], id: number) {
    const it = items.find((i) => i.id === id);
    if (it) navigate(ROUTES.workItem(it.key));
  }
}
