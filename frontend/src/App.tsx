import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AppShell } from '@/layout/AppShell';
import { ProjectLayout } from '@/layout/ProjectLayout';
import { RequireAuth } from '@/components/common/require-auth';

import { LoginPage } from '@/pages/LoginPage';
import { HomePage } from '@/pages/HomePage';
import { InboxPage } from '@/pages/InboxPage';
import { SearchPage } from '@/pages/SearchPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { WorkItemDetail } from '@/pages/WorkItemDetail';

// 프로젝트 본문 탭 (§9.1)
import { SummaryView } from '@/pages/project/SummaryView';
import { ListView } from '@/pages/project/ListView';
import { BoardView } from '@/pages/project/BoardView';
import { BacklogView } from '@/pages/project/BacklogView';
import { TimelineView } from '@/pages/project/TimelineView';
import { CalendarView } from '@/pages/project/CalendarView';
import { ApprovalsView } from '@/pages/project/ApprovalsView';
import { ReportsView } from '@/pages/project/ReportsView';

// 관리자
import { MeasureUnitsPage } from '@/pages/admin/MeasureUnitsPage';
import { FieldSchemesPage } from '@/pages/admin/FieldSchemesPage';
import { WorkflowsPage } from '@/pages/admin/WorkflowsPage';

// v0.4 Jira 라우팅. 글로벌 LNB 1개 + /projects/:key/탭(가로 탭) + /work-items/:key.
const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          // ── 글로벌 ──
          { index: true, element: <HomePage /> },
          { path: 'inbox', element: <InboxPage /> },
          { path: 'search', element: <SearchPage /> },
          { path: 'projects', element: <ProjectsPage /> },

          // ── 프로젝트 본문 탭 (Jira식) ──
          {
            path: 'projects/:key',
            element: <ProjectLayout />,
            children: [
              { index: true, element: <Navigate to="summary" replace /> },
              { path: 'summary', element: <SummaryView /> },
              { path: 'list', element: <ListView /> },
              { path: 'board', element: <BoardView /> },
              { path: 'backlog', element: <BacklogView /> },
              { path: 'timeline', element: <TimelineView /> },
              { path: 'calendar', element: <CalendarView /> },
              { path: 'approvals', element: <ApprovalsView /> },
              { path: 'reports', element: <ReportsView /> },
            ],
          },

          // ── 업무 상세 ──
          { path: 'work-items/:key', element: <WorkItemDetail /> },

          // ── 관리자 ──
          { path: 'admin/measure-units', element: <MeasureUnitsPage /> },
          { path: 'admin/field-schemes', element: <FieldSchemesPage /> },
          { path: 'admin/workflows', element: <WorkflowsPage /> },

          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}
