// 워크스페이스 선택/관리 (/select-workspace) — CR-018, WMP-WS-008.
// WS를 고르고(+ Admin이면 만들기/수정)하는 레이어. 선택은 localStorage 기억.
// 0개=안내(Admin은 만들기), 첫 진입 1개=자동, 다수=카드 선택. 목록은 BE "내 WS만"(BIZ-112).
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, LogOut, Pencil } from 'lucide-react';
import { Button, Skeleton } from '@therecommerce/ds-ui';
import { EmptyState } from '@/components/common/empty-state';
import {
  useWorkspaces, useCreateWorkspace, useUpdateWorkspace,
} from '@/features/workspaces/hooks';
import { WorkspaceDialog } from '@/features/workspaces/components/WorkspaceDialog';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useAuthStore } from '@/store/auth-store';
import { useLogout } from '@/features/auth/hooks';
import { ROUTES } from '@/lib/route-paths';
import type { Workspace } from '@/types/domain';
import type { WorkspaceRequest } from '@/features/workspaces/api';

export function SelectWorkspacePage() {
  const navigate = useNavigate();
  const { data: workspaces, isPending } = useWorkspaces();
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  const canManage = user?.role === 'OWNER' || user?.role === 'ADMIN'; // WS 생성/수정은 Admin/Owner(POL-004)
  const createWs = useCreateWorkspace();
  const updateWs = useUpdateWorkspace();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWs, setEditingWs] = useState<Workspace | null>(null);

  const choose = (id: number) => {
    setWorkspace(id);
    navigate(ROUTES.home, { replace: true });
  };

  // 첫 진입(아직 선택 WS 없음)이고 WS가 정확히 1개면 자동 진입.
  // 스위처 '전체 보기'로 일부러 온 경우(currentWorkspaceId 있음)는 자동 진입 안 함 — 만들기/수정하러 온 것.
  useEffect(() => {
    if (!isPending && !currentWorkspaceId && workspaces && workspaces.length === 1) {
      choose(workspaces[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending, currentWorkspaceId, workspaces]);

  const openCreate = () => { setEditingWs(null); setDialogOpen(true); };
  const openEdit = (e: React.MouseEvent, ws: Workspace) => {
    e.stopPropagation(); // 카드 선택(진입)과 분리
    setEditingWs(ws);
    setDialogOpen(true);
  };
  const submit = (body: WorkspaceRequest) => {
    const done = { onSuccess: () => setDialogOpen(false) };
    if (editingWs) updateWs.mutate({ id: editingWs.id, body }, done);
    else createWs.mutate(body, done);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">워크스페이스 선택</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user?.name}님, 작업할 워크스페이스를 선택하세요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 생성/추가 = primary (CLAUDE.md 버튼 일관성) */}
          {canManage && (
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus className="size-4" /> 워크스페이스 만들기
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => logout.mutate()}>
            <LogOut className="size-4" /> 로그아웃
          </Button>
        </div>
      </div>

      {isPending ? (
        <div className="grid gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : !workspaces || workspaces.length === 0 ? (
        <EmptyState
          icon={<Building2 className="size-8" />}
          title="속한 워크스페이스가 없습니다"
          description={canManage
            ? '위 “워크스페이스 만들기”로 새 워크스페이스를 만드세요.'
            : '관리자에게 워크스페이스 초대를 요청하세요. 추가되면 이곳에 표시됩니다.'}
        />
      ) : (
        <div className="grid gap-3">
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
            >
              <button
                type="button"
                onClick={() => choose(ws.id)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium text-foreground">{ws.name}</div>
                  {ws.description && (
                    <div className="truncate text-sm text-muted-foreground">{ws.description}</div>
                  )}
                </div>
              </button>
              {/* 수정 = secondary (CLAUDE.md). 카드 진입과 분리(stopPropagation) */}
              {canManage && (
                <Button variant="secondary" size="sm" onClick={(e) => openEdit(e, ws)}>
                  <Pencil className="size-4" /> 수정
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <WorkspaceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editingWs}
        busy={createWs.isPending || updateWs.isPending}
        onSubmit={submit}
      />
    </div>
  );
}
