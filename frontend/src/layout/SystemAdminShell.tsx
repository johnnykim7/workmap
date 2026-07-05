// 시스템 관리 셸 (CR-046) — 전역 설정(/admin/*)을 WS 컨텍스트 셸(AppShell) 밖으로 분리.
// 진입 = AppShell 계정 드롭다운 "시스템 관리"(canAdmin). WS 스위처·프로젝트 사이드 없음(전역).
// 탭 네비는 각 admin 페이지가 내부에서 렌더하는 <AdminTabs/>가 담당 — 여기선 상단 바(제목 + 앱 복귀)만.
// 비관리자가 URL 직타 시 홈으로 리다이렉트(BE @PreAuthorize가 최종 권위, 여기는 UX).
import { Outlet, useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@therecommerce/ds-ui';
import { ArrowLeft, Settings } from 'lucide-react';
import { ROUTES } from '@/lib/route-paths';
import { useCanAdmin } from '@/lib/permissions';

export function SystemAdminShell() {
  const navigate = useNavigate();
  const canAdmin = useCanAdmin();

  // 비관리자는 시스템 관리 진입 불가(POL-014) — 홈으로. (BE도 403으로 막음.)
  if (!canAdmin) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-background">
      {/* 상단 바 — 전역 셸임을 드러냄(WS 사이드 없음) + 앱 복귀 */}
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Settings className="size-4" />
          </div>
          <span className="text-base font-semibold text-foreground">시스템 관리</span>
        </div>
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate(ROUTES.home)}>
          <ArrowLeft className="size-4" /> 앱으로
        </Button>
      </header>

      <main className="mx-auto min-h-0 w-full max-w-6xl flex-1 overflow-y-auto p-5">
        <Outlet />
      </main>
    </div>
  );
}
