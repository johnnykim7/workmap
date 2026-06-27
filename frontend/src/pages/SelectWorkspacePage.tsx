// 워크스페이스 선택 (/select-workspace) — CR-018, WMP-WS-008.
// 로그인 후 작업할 WS를 고른다. 선택은 localStorage 기억 → 다음 진입 자동.
// 0개=안내, 1개=자동 진입, 다수=카드 선택. 목록은 BE가 "내 WS만" 반환(BIZ-112).
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, LogOut } from 'lucide-react';
import { Button, Skeleton } from '@therecommerce/ds-ui';
import { EmptyState } from '@/components/common/empty-state';
import { useWorkspaces } from '@/features/workspaces/hooks';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useAuthStore } from '@/store/auth-store';
import { useLogout } from '@/features/auth/hooks';
import { ROUTES } from '@/lib/route-paths';

export function SelectWorkspacePage() {
  const navigate = useNavigate();
  const { data: workspaces, isPending } = useWorkspaces();
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  const choose = (id: number) => {
    setWorkspace(id);
    navigate(ROUTES.home, { replace: true });
  };

  // WS가 정확히 1개면 자동 진입(고를 게 없음).
  useEffect(() => {
    if (!isPending && workspaces && workspaces.length === 1) {
      choose(workspaces[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending, workspaces]);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">워크스페이스 선택</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user?.name}님, 작업할 워크스페이스를 선택하세요.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => logout.mutate()}>
          <LogOut className="size-4" /> 로그아웃
        </Button>
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
          description="관리자에게 워크스페이스 초대를 요청하세요. 워크스페이스에 추가되면 이곳에 표시됩니다."
        />
      ) : (
        <div className="grid gap-3">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              type="button"
              onClick={() => choose(ws.id)}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          ))}
        </div>
      )}
    </div>
  );
}
