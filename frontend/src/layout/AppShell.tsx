// 전역 레이아웃 — 글로벌 LNB 1개 (T3-3 §9.1, Jira식).
// ds-ui AdminShell(Sidebar + 헤더 슬롯 + 본문) 기반. raw <button> LNB 금지 규칙 준수.
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AdminShell,
  Button,
  Avatar,
  AvatarFallback,
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
  Search,
  FolderKanban,
  Settings,
  Plus,
  LogOut,
} from 'lucide-react';
import { ROUTES } from '@/lib/route-paths';
import { useUiStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { useLogout } from '@/features/auth/hooks';
import { CreateModal } from '@/components/common/create-modal';

// 글로벌 LNB 메뉴 (§9.1). 프로젝트 목록은 Sprint2 API 연동 시 children으로 동적 주입.
const MENU = [
  { path: ROUTES.home, label: '회사 홈', icon: <Map className="size-4" /> },
  { path: ROUTES.inbox, label: '받은함', icon: <Inbox className="size-4" /> },
  { path: ROUTES.search, label: '검색', icon: <Search className="size-4" /> },
  { path: ROUTES.projects, label: '프로젝트', icon: <FolderKanban className="size-4" /> },
  { path: ROUTES.admin.measureUnits, label: '설정', icon: <Settings className="size-4" /> },
];

function HeaderActions() {
  const navigate = useNavigate();
  const openCreate = useUiStore((s) => s.openCreateModal);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <div className="flex w-full items-center justify-between gap-3">
      <Button
        variant="outline"
        size="sm"
        className="w-72 justify-start text-muted-foreground"
        onClick={() => navigate(ROUTES.search)}
      >
        <Search className="size-4" /> 검색…
      </Button>
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

  return (
    <AdminShell
      menuItems={MENU}
      currentPath={pathname}
      onNavigate={(p) => navigate(p)}
      linkComponent={Link}
      logo={
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Map className="size-4" />
          </div>
          <span className="text-sm font-semibold">WorkMap</span>
        </div>
      }
      logoCollapsed={<Map className="size-5" />}
      header={<HeaderActions />}
    >
      <div className="p-5">
        <Outlet />
      </div>
      <CreateModal />
    </AdminShell>
  );
}
