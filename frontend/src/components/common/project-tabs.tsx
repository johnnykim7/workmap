// 프로젝트 본문 상단 가로 탭 (Jira식, T3-3 §9.1, CR-019/020).
// 각 탭 = 라벨(폴백 적용) + 호버 시 … 메뉴(기본값/이름바꾸기/좌우이동/제거).
// 가로탭 옆 [+]로 안 켜진 탭 추가. 라벨은 GET /projects/{id}/tabs(상수 의존 제거).
// ds-ui DropdownMenu/Dialog — 네이티브 위젯 금지.
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
  Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input,
} from '@therecommerce/ds-ui';
import { Plus, MoreHorizontal } from 'lucide-react';
import { ROUTES, type ProjectTab } from '@/lib/route-paths';
import { PROJECT_TAB_LABEL } from '@/types/domain';
import {
  useUpdateProject, useProjectTabs, useRenameTab, useResetTabLabel,
} from '@/features/projects/hooks';
import { ALL_TABS, nextActiveTabs, removeTab, moveTab } from './project-tabs-util';

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

  const current = tabs.find((t) => pathname.endsWith(`/${t}`)) ?? tabs[0];

  // 라벨/기본탭/커스텀 여부 — GET /tabs 우선, 없으면 상수 폴백.
  const labelOf = (code: string) =>
    tabData?.tabs.find((t) => t.code === code)?.label ?? PROJECT_TAB_LABEL[code] ?? code;
  const isDefault = (code: string) =>
    tabData?.tabs.find((t) => t.code === code)?.isDefault ?? false;
  const isCustom = (code: string) =>
    tabData?.tabs.find((t) => t.code === code)?.isCustom ?? false;

  // 이름 바꾸기 다이얼로그 상태
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');

  const base = activeTabs?.length ? activeTabs : tabs;

  const patchTabs = (nextTabs: string[], goto?: string) => {
    if (projectId == null) return;
    updateMut.mutate(
      { id: projectId, body: { activeTabs: nextTabs } },
      goto ? { onSuccess: () => navigate(ROUTES.project(projectKey, goto as ProjectTab)) } : undefined,
    );
  };

  const addTab = (tab: ProjectTab) => patchTabs(nextActiveTabs(base, tab), tab);
  const doRemove = (code: string) => {
    const next = removeTab(base, code);
    // 현재 보던 탭을 지웠으면 요약으로.
    patchTabs(next, code === current ? 'summary' : undefined);
  };
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

  const addable = ALL_TABS.filter((t) => !new Set(tabs).has(t));
  const canEdit = projectId != null;

  return (
    <div className="mb-4 flex items-center gap-0.5 border-b border-border">
      {tabs.map((t) => {
        const active = t === current;
        const isSummary = t === 'summary';
        const canMoveLeft = base.indexOf(t) > 1; // summary(0) 다음 자리까진 못 감
        const canMoveRight = base.indexOf(t) < base.length - 1;
        return (
          <div
            key={t}
            className={`group relative flex items-center gap-1 px-3 py-2 text-sm cursor-pointer border-b-2 ${
              active ? 'border-primary text-foreground font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span onClick={() => navigate(ROUTES.project(projectKey, t as ProjectTab))}>
              {labelOf(t)}
              {isDefault(t) && <span className="ml-1 text-xs text-muted-foreground">★</span>}
            </span>
            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="invisible group-hover:visible rounded p-0.5 hover:bg-muted"
                    aria-label={`${labelOf(t)} 탭 메뉴`}
                  >
                    <MoreHorizontal className="size-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem disabled={isSummary || isDefault(t)} onClick={() => setDefault(t)}>
                    기본값으로 설정
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openRename(t)}>
                    이름 바꾸기
                  </DropdownMenuItem>
                  {isCustom(t) && (
                    <DropdownMenuItem onClick={() => resetMut.mutate({ id: projectId!, code: t })}>
                      이름 되돌리기
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled={isSummary || !canMoveLeft} onClick={() => doMove(t, -1)}>
                    탭을 왼쪽으로 이동
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={isSummary || !canMoveRight} onClick={() => doMove(t, 1)}>
                    탭을 오른쪽으로 이동
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={isSummary}
                    className="text-destructive"
                    onClick={() => doRemove(t)}
                  >
                    제거
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      })}

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
            {addable.map((t) => (
              <DropdownMenuItem key={t} onClick={() => addTab(t)}>
                {labelOf(t)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* 이름 바꾸기 다이얼로그 */}
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
