// 전역 레이아웃 — 글로벌 LNB 1개 (T3-3 §9.1, Jira식 + CR-018 WS 컨텍스트).
// WS = 슬랙식 격리 작업공간. LNB 상단 WS 스위처 + 그 WS 프로젝트 나열(ⓐ).
// WS 미선택이면 /select-workspace로. 선택 WS가 내 목록에 없으면(탈퇴 등) 무효화.
import { useEffect, useMemo } from 'react';
import { Link, Outlet, useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import {
  AdminShell,
  Button,
  Avatar,
  AvatarFallback,
  Skeleton,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@therecommerce/ds-ui';
import {
  Map,
  Inbox,
  MessageSquare,
  Search,
  FolderKanban,
  Settings,
  Plus,
  LogOut,
  Building2,
  ChevronsUpDown,
  Check,
  Users,
  LayoutGrid,
} from 'lucide-react';
import { ROUTES } from '@/lib/route-paths';
import { useUiStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useLogout } from '@/features/auth/hooks';
import { useWorkspaces } from '@/features/workspaces/hooks';
import { useProjects, useProjectByKey } from '@/features/projects/hooks';
import { CreateModal } from '@/components/common/create-modal';

// 글로벌 LNB 고정 메뉴 (§9.1). 프로젝트 목록은 선택 WS 기준 children으로 동적 주입.
const FIXED_MENU = [
  { path: ROUTES.home, label: '회사 홈', icon: <Map className="size-4" /> },
  { path: ROUTES.inbox, label: '받은함', icon: <Inbox className="size-4" /> },
  { path: ROUTES.chat, label: '메시지', icon: <MessageSquare className="size-4" /> },
  { path: ROUTES.search, label: '검색', icon: <Search className="size-4" /> },
];

/** LNB 최상단 WS 스위처 (CR-018). 내가 속한 WS만(BIZ-112). 잘 안 바꿈 → 조용히 고정. */
function WorkspaceSwitcher({ currentName }: { currentName: string }) {
  const navigate = useNavigate();
  const { data: workspaces = [] } = useWorkspaces();
  const currentId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === 'OWNER' || role === 'ADMIN';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-4" />
          </div>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{currentName}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">워크스페이스 전환</DropdownMenuLabel>
        {workspaces.map((ws) => (
          <DropdownMenuItem key={ws.id} onSelect={() => setWorkspace(ws.id)}>
            <Building2 className="size-4" />
            <span className="flex-1 truncate">{ws.name}</span>
            {ws.id === currentId && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {/* WS를 만들고·고르고·수정하는 레이어로 진입(만들기는 거기 있음, CR-018) */}
        <DropdownMenuItem onSelect={() => navigate(ROUTES.selectWorkspace)}>
          <LayoutGrid className="size-4" /> 워크스페이스 전체 보기
        </DropdownMenuItem>
        {canManage && currentId && (
          <DropdownMenuItem onSelect={() => navigate(ROUTES.workspaceMembers(currentId))}>
            <Users className="size-4" /> 멤버 관리
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 헤더 좌측 타이틀 — "지금 어느 화면인가"를 항상 표시(검색바 자리 대체).
// 일반 화면은 경로→라벨, 프로젝트 화면은 프로젝트명(클릭=목록으로 이동, 본문 브레드크럼 제거 대체).
function HeaderTitle() {
  const { pathname } = useLocation();
  const { key = '' } = useParams();
  const { data: project, isPending } = useProjectByKey(key);

  // 프로젝트 화면: 프로젝트명 + 목록 이동 링크.
  if (pathname.startsWith('/projects/') && key) {
    if (isPending) return <Skeleton className="h-5 w-40" />;
    return (
      <Link
        to={ROUTES.projects}
        className="truncate text-base font-semibold text-foreground outline-none hover:text-primary focus-visible:underline"
      >
        {project?.name ?? key}
      </Link>
    );
  }

  // 그 외 화면: 경로 → 화면명(LNB 메뉴 라벨과 동일 톤).
  const label =
    pathname === ROUTES.home
      ? '회사 홈'
      : pathname.startsWith(ROUTES.inbox)
        ? '받은함'
        : pathname.startsWith(ROUTES.chat)
          ? '메시지'
          : pathname.startsWith(ROUTES.search)
            ? '검색'
          : pathname.startsWith(ROUTES.projects)
            ? '프로젝트'
            : pathname.startsWith('/admin')
              ? '설정'
              : pathname.startsWith('/workspaces')
                ? '워크스페이스'
                : '';
  return <span className="truncate text-base font-semibold text-foreground">{label}</span>;
}

function HeaderActions() {
  const openCreate = useUiStore((s) => s.openCreateModal);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <div className="flex w-full items-center justify-between gap-3">
      <HeaderTitle />
      <div className="flex items-center gap-3">
        {/* 생성/추가 = primary (CLAUDE.md 버튼 일관성) */}
        <Button variant="primary" size="sm" onClick={openCreate}>
          <Plus className="size-4" /> 만들기
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" aria-label="계정 메뉴">
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">{user?.name?.[0] ?? '?'}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="text-sm font-medium">{user?.name ?? '사용자'}</div>
              <div className="text-xs font-normal text-muted-foreground">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => logout.mutate()}>
              <LogOut className="size-4" /> 로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const clearWorkspace = useWorkspaceStore((s) => s.clearWorkspace);
  const { data: workspaces, isPending: wsLoading } = useWorkspaces();

  // 선택 WS가 내 목록에 없으면(탈퇴/삭제) 무효화 — 클라 기억만 믿지 않음(BIZ-112).
  const currentWs = workspaces?.find((w) => w.id === currentWorkspaceId) ?? null;
  useEffect(() => {
    if (!wsLoading && currentWorkspaceId && workspaces && !currentWs) {
      clearWorkspace();
    }
  }, [wsLoading, currentWorkspaceId, workspaces, currentWs, clearWorkspace]);

  // 선택 WS의 프로젝트만(BIZ-112) — LNB children으로 나열(ⓐ).
  const { data: projects = [] } = useProjects(
    currentWorkspaceId ? { workspaceId: currentWorkspaceId } : {},
  );

  const menuItems = useMemo(() => {
    const projectChildren = projects.map((p) => ({
      path: ROUTES.project(p.key),
      label: p.name,
    }));
    return [
      ...FIXED_MENU,
      {
        path: ROUTES.projects,
        label: '프로젝트',
        icon: <FolderKanban className="size-4" />,
        children: projectChildren,
      },
      { path: ROUTES.admin.measureUnits, label: '설정', icon: <Settings className="size-4" /> },
    ];
  }, [projects]);

  // WS 미선택이면 선택 화면으로(WMP-WS-008).
  if (!wsLoading && !currentWorkspaceId) {
    return <Navigate to={ROUTES.selectWorkspace} replace />;
  }

  return (
    <AdminShell
      menuItems={menuItems}
      currentPath={pathname}
      onNavigate={(p) => navigate(p)}
      linkComponent={Link}
      logo={<WorkspaceSwitcher currentName={currentWs?.name ?? 'WorkMap'} />}
      logoCollapsed={<Building2 className="size-5" />}
      header={<HeaderActions />}
    >
      <div className="p-5">
        <Outlet />
      </div>
      <CreateModal />
    </AdminShell>
  );
}
