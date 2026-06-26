// 관리자 설정 공통 서브 탭 — 측정단위 / 필드스킴 / 워크플로. 3개 관리자 화면 상단에 공통 노출.
// route-paths.ts ROUTES.admin 상수만 참조(경로 직접 작성 금지).
import { NavLink } from 'react-router-dom';
import { cn } from '@therecommerce/ds-ui';
import { Ruler, ListChecks, GitBranch, Shapes, FileText, Users } from 'lucide-react';
import { ROUTES } from '@/lib/route-paths';
import type { ReactNode } from 'react';

const TABS: { to: string; label: string; icon: ReactNode }[] = [
  { to: ROUTES.admin.measureUnits, label: '측정 단위', icon: <Ruler className="size-4" /> },
  { to: ROUTES.admin.fieldSchemes, label: '필드 스킴', icon: <ListChecks className="size-4" /> },
  { to: ROUTES.admin.workflows, label: '워크플로', icon: <GitBranch className="size-4" /> },
  { to: ROUTES.admin.issueTypes, label: '업무 유형', icon: <Shapes className="size-4" /> },
  { to: ROUTES.admin.forms, label: '양식 빌더', icon: <FileText className="size-4" /> },
  { to: ROUTES.admin.users, label: '사용자', icon: <Users className="size-4" /> },
];

export function AdminTabs() {
  return (
    <div className="mb-5 flex items-center gap-1 border-b border-border">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )
          }
        >
          {t.icon}
          {t.label}
        </NavLink>
      ))}
    </div>
  );
}
