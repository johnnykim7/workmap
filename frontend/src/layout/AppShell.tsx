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
  KeyRound,
  Bell,
  Palette,
} from 'lucide-react';
import { ROUTES } from '@/lib/route-paths';
import { useCanWrite } from '@/lib/permissions';
import { useUiStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useLogout } from '@/features/auth/hooks';
import { useNewNotificationToast } from '@/features/inbox/hooks';
import { NotificationBell } from '@/features/inbox/components/NotificationBell';
import { useWorkspaces } from '@/features/workspaces/hooks';
import { useProjects, useProjectByKey } from '@/features/projects/hooks';
import { useChannels } from '@/features/chat/hooks';
import { CreateModal } from '@/components/common/create-modal';

// 글로벌 LNB 고정 메뉴 (§9.1). 프로젝트·메시지(채널)는 선택 WS 기준 children으로 동적 주입.
const FIXED_MENU = [
  { path: ROUTES.home, label: '대시보드', icon: <Map className="size-4" /> },
  { path: ROUTES.inbox, label: '알림', icon: <Inbox className="size-4" /> },
  { path: ROUTES.search, label: '검색', icon: <Search className="size-4" /> },
];

// 헤더 화면명의 단일 소스 = LNB 메뉴 라벨. 여기에 항목만 추가하면 LNB·헤더가 함께 반영된다.
// (children이 동적인 워크룸/프로젝트도 그룹 라벨은 고정이라 여기서 관리.)
const HEADER_MENU = [
  ...FIXED_MENU,
  { path: ROUTES.chat, label: '워크룸' },
  { path: ROUTES.projects, label: '프로젝트' },
  { path: '/admin', label: '설정' },
  { path: '/workspaces', label: '워크스페이스' },
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
          className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        {/* 전체 보기(CR-045) — 내 모든 WS 프로젝트를 WS별 그룹으로 한 화면에. WS가 많을 때 훑기용 */}
        <DropdownMenuItem onSelect={() => navigate(`${ROUTES.projects}?all=1`)}>
          <LayoutGrid className="size-4" /> 워크스페이스 전체 보기
        </DropdownMenuItem>
        {/* WS를 만들고·고르고·수정하는 레이어로 진입(만들기는 거기 있음, CR-018) */}
        <DropdownMenuItem onSelect={() => navigate(ROUTES.selectWorkspace)}>
          <Settings className="size-4" /> 워크스페이스 관리
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

  // 그 외 화면: 경로 → 화면명. LNB 메뉴 라벨(HEADER_MENU)을 그대로 재사용해
  // LNB와 헤더 네이밍이 한 소스에서 항상 일치하도록 한다(하드코딩 중복 제거).
  // 홈은 정확히 일치, 나머지는 prefix 매칭. 더 긴 경로가 먼저 잡히도록 길이 내림차순.
  const matched = [...HEADER_MENU]
    .sort((a, b) => b.path.length - a.path.length)
    .find((m) => (m.path === ROUTES.home ? pathname === ROUTES.home : pathname.startsWith(m.path)));
  const label = matched?.label ?? '';
  return <span className="truncate text-base font-semibold text-foreground">{label}</span>;
}

function HeaderActions() {
  const openCreate = useUiStore((s) => s.openCreateModal);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();
  const canWrite = useCanWrite(); // VIEWER는 만들기 숨김(CR-031, 서버 403과 일치)

  // 새 알림 도착 시 토스트(전역 1회 마운트 — 헤더에만 둬 중복 방지).
  useNewNotificationToast();

  return (
    <div className="flex w-full items-center justify-between gap-3">
      <HeaderTitle />
      <div className="flex items-center gap-3">
        {/* 생성/추가 = primary (CLAUDE.md 버튼 일관성). VIEWER는 쓰기 불가라 숨김. */}
        {canWrite && (
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="size-4" /> 만들기
          </Button>
        )}
        <NotificationBell />
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
            <DropdownMenuItem onSelect={() => navigate(ROUTES.accountNotifications)}>
              <Bell className="size-4" /> 알림 설정
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate(ROUTES.accountTheme)}>
              <Palette className="size-4" /> 화면 테마
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate(ROUTES.accountPassword)}>
              <KeyRound className="size-4" /> 비밀번호 변경
            </DropdownMenuItem>
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

  // 선택 WS의 채팅 채널 — '메시지' 메뉴의 children으로 나열(프로젝트와 동일 패턴).
  // 안 읽음 수는 label 끝에 텍스트로 표시(ds-ui AdminShell children은 path/label만 받음 — CSS 부작용 방지).
  const { data: channels = [] } = useChannels(currentWorkspaceId);

  const menuItems = useMemo(() => {
    // 그룹 헤더('프로젝트')는 children이 있으면 클릭 시 펼치기만 됨(ds-ui AdminShell 동작).
    // → 프로젝트 목록/관리 화면(/projects) 진입점이 없어져, children 최상단에 별도 항목으로 제공.
    // children은 label 텍스트만 렌더 가능(아이콘/색 불가) → 대괄호로 구분 표식.
    const projectChildren = [
      { path: ROUTES.projects, label: '[전체 프로젝트]' },
      ...projects.map((p) => ({
        path: ROUTES.project(p.key),
        label: p.name,
      })),
    ];
    const channelChildren = channels.map((c) => {
      const unread = c.unreadCount > 0 ? `  (${c.unreadCount > 99 ? '99+' : c.unreadCount})` : '';
      return {
        path: ROUTES.chatChannel(c.id),
        label: `${c.displayName}${unread}`,
      };
    });
    return [
      ...FIXED_MENU,
      {
        path: ROUTES.chat,
        label: '워크룸',
        icon: <MessageSquare className="size-4" />,
        children: channelChildren,
      },
      {
        path: ROUTES.projects,
        label: '프로젝트',
        icon: <FolderKanban className="size-4" />,
        children: projectChildren,
      },
      { path: ROUTES.admin.measureUnits, label: '설정', icon: <Settings className="size-4" /> },
    ];
  }, [projects, channels]);

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
      {/* 높이 체인 시작점 — admin-shell-content(ds-ui가 overflow-y-auto)의 높이를 자식에 전달.
       * h-full+flex-col로 PageShell을 쓰는 화면은 이 높이를 받아 "헤더 고정 + 본문만 스크롤"을
       * 성립시키고, 안 쓰는 화면은 콘텐츠가 넘치면 admin-shell-content가 자연 스크롤한다.
       * min-h-0 = flex 자식이 넘칠 때 스크롤이 성립하도록(기본 min-height:auto가 넘침을 막음). */}
      <div className="flex h-full min-h-0 flex-col p-5">
        <Outlet />
      </div>
      <CreateModal />
    </AdminShell>
  );
}
