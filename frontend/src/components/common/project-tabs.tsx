// 프로젝트 본문 상단 가로 탭 (Jira식, T3-3 §9.1, CR-019/020).
// 각 탭 = 아이콘 + 라벨(폴백) + 호버 … 메뉴(기본값/이름바꾸기/좌우이동/제거) + 드래그 재정렬.
// 라벨은 GET /projects/{id}/tabs(상수 의존 제거). 드래그/이동/제거는 activeTabs PATCH(BE 무변경).
// ds-ui DropdownMenu/Dialog + dnd-kit(백로그와 동일) — 네이티브 위젯 금지.
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DndContext, PointerSensor, useSensor, useSensors, closestCenter, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, horizontalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
  Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input,
} from '@therecommerce/ds-ui';
import {
  Plus, MoreHorizontal,
  LayoutDashboard, List, Columns3, ListTodo, GanttChartSquare, Calendar, CheckCircle2, BarChart3,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES, type ProjectTab } from '@/lib/route-paths';
import { PROJECT_TAB_LABEL } from '@/types/domain';
import {
  useUpdateProject, useProjectTabs, useRenameTab, useResetTabLabel,
} from '@/features/projects/hooks';
import { ALL_TABS, nextActiveTabs, removeTab, moveTab, reorderTabs } from './project-tabs-util';

// 탭 코드 → 아이콘(코드가 안정적 키라 FE 매핑으로 충분 — BE는 tab_def.icon에 코드 보관).
const TAB_ICON: Record<string, LucideIcon> = {
  summary: LayoutDashboard,
  list: List,
  board: Columns3,
  backlog: ListTodo,
  timeline: GanttChartSquare,
  calendar: Calendar,
  approvals: CheckCircle2,
  reports: BarChart3,
};

interface Props {
  projectKey: string;
  tabs: string[];          // ProjectLayout이 계산한 노출 탭(activeTabs 우선)
  projectId?: number;
  activeTabs?: string[];
}

export function ProjectTabs({ projectKey, tabs, projectId, activeTabs }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const updateMut = useUpdateProject();
  const renameMut = useRenameTab();
  const resetMut = useResetTabLabel();
  const { data: tabData } = useProjectTabs(projectId);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const current = tabs.find((t) => pathname.endsWith(`/${t}`)) ?? tabs[0];

  const labelOf = (code: string) =>
    tabData?.tabs.find((t) => t.code === code)?.label ?? PROJECT_TAB_LABEL[code] ?? code;
  const isDefault = (code: string) =>
    tabData?.tabs.find((t) => t.code === code)?.isDefault ?? false;
  const isCustom = (code: string) =>
    tabData?.tabs.find((t) => t.code === code)?.isCustom ?? false;

  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');

  const base = activeTabs?.length ? activeTabs : tabs;
  const canEdit = projectId != null;

  const patchTabs = (nextTabs: string[], goto?: string) => {
    if (projectId == null) return;
    updateMut.mutate(
      { id: projectId, body: { activeTabs: nextTabs } },
      goto ? { onSuccess: () => navigate(ROUTES.project(projectKey, goto as ProjectTab)) } : undefined,
    );
  };

  const addTab = (tab: ProjectTab) => patchTabs(nextActiveTabs(base, tab), tab);
  const doRemove = (code: string) =>
    patchTabs(removeTab(base, code), code === current ? 'summary' : undefined);
  const doMove = (code: string, dir: -1 | 1) => patchTabs(moveTab(base, code, dir));
  const setDefault = (code: string) => {
    if (projectId == null) return;
    updateMut.mutate({ id: projectId, body: { defaultTab: code } });
  };
  const openRename = (code: string) => { setRenaming(code); setRenameVal(labelOf(code)); };
  const submitRename = () => {
    if (projectId == null || !renaming) return;
    const v = renameVal.trim();
    if (!v) return;
    renameMut.mutate({ id: projectId, code: renaming, label: v },
      { onSuccess: () => setRenaming(null) });
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const next = reorderTabs(base, String(active.id), String(over.id));
    if (next.join() !== base.filter((t) => ALL_TABS.includes(t as never)).join()) patchTabs(next);
  };

  const addable = ALL_TABS.filter((t) => !new Set(tabs).has(t));

  return (
    // 스크롤해도 탭 바 고정 — 스크롤 컨테이너(admin-shell-content) 상단에 붙는다.
    // AppShell 본문 패딩(p-5=20px) 위로 스크롤되는 콘텐츠가 탭 뒤로 비치지 않게 배경(bg-card=content 배경)
    // + 좌우를 -mx-5로 패딩만큼 넓혀 본문이 탭 옆으로 새지 않도록 덮고, 내부는 px-5로 원위치 정렬.
    // pt-5로 상단 패딩을 탭 바가 흡수(부모 p-5 상단 여백이 탭 위 빈 틈으로 남는 것 방지).
    <div className="sticky -top-5 z-20 -mx-5 mb-4 flex items-center gap-0.5 border-b border-border bg-card px-5 pt-5">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tabs} strategy={horizontalListSortingStrategy}>
          {tabs.map((t) => (
            <TabItem
              key={t}
              code={t}
              label={labelOf(t)}
              active={t === current}
              isDefault={isDefault(t)}
              isCustom={isCustom(t)}
              canEdit={canEdit}
              canMoveLeft={base.indexOf(t) > 1}
              canMoveRight={base.indexOf(t) < base.length - 1}
              onClick={() => navigate(ROUTES.project(projectKey, t as ProjectTab))}
              onSetDefault={() => setDefault(t)}
              onRename={() => openRename(t)}
              onReset={() => resetMut.mutate({ id: projectId!, code: t })}
              onMove={(dir) => doMove(t, dir)}
              onRemove={() => doRemove(t)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {canEdit && addable.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7" aria-label="탭 추가"
              disabled={updateMut.isPending}>
              <Plus className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>탭 추가</DropdownMenuLabel>
            {addable.map((t) => {
              const Icon = TAB_ICON[t];
              return (
                <DropdownMenuItem key={t} onClick={() => addTab(t)}>
                  {Icon && <Icon className="size-4" />} {labelOf(t)}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Dialog open={renaming != null} onOpenChange={(o) => { if (!o) setRenaming(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>탭 이름 바꾸기</DialogTitle>
          </DialogHeader>
          <Input
            value={renameVal}
            onChange={(e) => setRenameVal(e.target.value)}
            placeholder="탭 이름"
            maxLength={60}
            onKeyDown={(e) => { if (e.key === 'Enter') submitRename(); }}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenaming(null)}>취소</Button>
            <Button variant="primary" disabled={!renameVal.trim() || renameMut.isPending}
              onClick={submitRename}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TabItemProps {
  code: string;
  label: string;
  active: boolean;
  isDefault: boolean;
  isCustom: boolean;
  canEdit: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onClick: () => void;
  onSetDefault: () => void;
  onRename: () => void;
  onReset: () => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}

function TabItem(p: TabItemProps) {
  const isSummary = p.code === 'summary';
  const Icon = TAB_ICON[p.code];
  // summary는 드래그 비활성(맨 앞 고정).
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: p.code,
    disabled: isSummary,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-1 px-3 py-2 text-sm border-b-2 ${
        p.active
          ? 'border-primary text-foreground font-medium'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {/* 라벨/아이콘 영역 = 클릭 이동 + (summary 외) 드래그 핸들 */}
      <span
        className={`flex items-center gap-1.5 ${isSummary ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
        onClick={p.onClick}
        {...(isSummary ? {} : attributes)}
        {...(isSummary ? {} : listeners)}
      >
        {Icon && <Icon className="size-4 shrink-0" />}
        {p.label}
        {p.isDefault && <span className="ml-0.5 text-xs text-muted-foreground">★</span>}
      </span>

      {p.canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="invisible group-hover:visible rounded p-0.5 hover:bg-muted"
              aria-label={`${p.label} 탭 메뉴`}
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem disabled={isSummary || p.isDefault} onClick={p.onSetDefault}>
              기본값으로 설정
            </DropdownMenuItem>
            <DropdownMenuItem onClick={p.onRename}>이름 바꾸기</DropdownMenuItem>
            {p.isCustom && (
              <DropdownMenuItem onClick={p.onReset}>이름 되돌리기</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={isSummary || !p.canMoveLeft} onClick={() => p.onMove(-1)}>
              탭을 왼쪽으로 이동
            </DropdownMenuItem>
            <DropdownMenuItem disabled={isSummary || !p.canMoveRight} onClick={() => p.onMove(1)}>
              탭을 오른쪽으로 이동
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={isSummary} className="text-destructive" onClick={p.onRemove}>
              제거
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
