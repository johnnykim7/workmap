import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AppShell } from '@/layout/AppShell';
import { SystemAdminShell } from '@/layout/SystemAdminShell';
import { ProjectLayout } from '@/layout/ProjectLayout';
import { RequireAuth } from '@/components/common/require-auth';

import { LoginPage } from '@/pages/LoginPage';
import { InviteAcceptPage } from '@/pages/InviteAcceptPage';
import { PasswordForgotPage } from '@/pages/PasswordForgotPage';
import { PasswordResetPage } from '@/pages/PasswordResetPage';
import { SignupRequestPage } from '@/pages/SignupRequestPage';
import { AccountProfilePage } from '@/pages/AccountProfilePage';
import { AccountPasswordPage } from '@/pages/AccountPasswordPage';
import { AccountNotificationsPage } from '@/pages/AccountNotificationsPage';
import { AccountThemePage } from '@/pages/AccountThemePage';
import { SelectWorkspacePage } from '@/pages/SelectWorkspacePage';
import { WorkspaceMembersPage } from '@/pages/WorkspaceMembersPage';
import { WorkspaceSettingsPage } from '@/pages/WorkspaceSettingsPage';
import { HomePage } from '@/pages/HomePage';
import { InboxPage } from '@/pages/InboxPage';
import { SearchPage } from '@/pages/SearchPage';
import { ChatPage } from '@/pages/ChatPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { WorkItemDetail } from '@/pages/WorkItemDetail';

// 프로젝트 본문 탭 (§9.1)
import { SummaryView } from '@/pages/project/SummaryView';
import { ListView } from '@/pages/project/ListView';
import { BoardView } from '@/pages/project/BoardView';
import { BacklogView } from '@/pages/project/BacklogView';
import { TimelineView } from '@/pages/project/TimelineView';
import { CalendarView } from '@/pages/project/CalendarView';
import { AttachmentsView } from '@/pages/project/AttachmentsView';
import { ApprovalsView } from '@/pages/project/ApprovalsView';
import { ReportsView } from '@/pages/project/ReportsView';

// 관리자
import { MeasureUnitsPage } from '@/pages/admin/MeasureUnitsPage';
import { FieldSchemesPage } from '@/pages/admin/FieldSchemesPage';
import { WorkflowsPage } from '@/pages/admin/WorkflowsPage';
import { IssueTypesPage } from '@/pages/admin/IssueTypesPage';
import { FormsPage } from '@/pages/admin/FormsPage';
import { UsersPage } from '@/pages/admin/UsersPage';

// v0.4 Jira 라우팅. 글로벌 LNB 1개 + /projects/:key/탭(가로 탭) + /work-items/:key.
const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  // CR-027 — 공개(로그인 못 하는 사용자가 사용): 초대 수락 · 비밀번호 찾기
  { path: '/invite/accept', element: <InviteAcceptPage /> },
  { path: '/password/forgot', element: <PasswordForgotPage /> },
  { path: '/password/reset', element: <PasswordResetPage /> },
  { path: '/signup-request', element: <SignupRequestPage /> },
  {
    element: <RequireAuth />,
    children: [
      // WS 선택 화면 — AppShell(WS 컨텍스트 필요) 밖. 인증만 필요(WMP-WS-008).
      { path: '/select-workspace', element: <SelectWorkspacePage /> },
      {
        path: '/',
        element: <AppShell />,
        children: [
          // ── 글로벌 ──
          { index: true, element: <HomePage /> },
          { path: 'inbox', element: <InboxPage /> },
          { path: 'search', element: <SearchPage /> },
          { path: 'chat', element: <ChatPage /> },
          { path: 'chat/:channelId', element: <ChatPage /> },
          { path: 'projects', element: <ProjectsPage /> },
          // CR-046 — WS 자신의 설정(일반/멤버/채널/보관). LNB "설정" 자리.
          { path: 'workspaces/:wsId/settings', element: <WorkspaceSettingsPage /> },
          // 하위호환 — 기존 멤버 URL/링크는 설정 화면(멤버 탭 기본)으로 흡수.
          { path: 'workspaces/:wsId/members', element: <WorkspaceMembersPage /> },
          // CR-047 — 내 프로필(프로필 사진 편집)
          { path: 'account/profile', element: <AccountProfilePage /> },
          // CR-027 — 로그인 상태 비밀번호 변경(2차 인증)
          { path: 'account/password', element: <AccountPasswordPage /> },
          // CR-028 — 알림 수신 설정(종류 × 채널)
          { path: 'account/notifications', element: <AccountNotificationsPage /> },
          // 개인 화면 테마(프리셋 — LNB 톤 + 포인트색)
          { path: 'account/theme', element: <AccountThemePage /> },

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
              { path: 'attachments', element: <AttachmentsView /> },
              { path: 'approvals', element: <ApprovalsView /> },
              { path: 'reports', element: <ReportsView /> },
            ],
          },

          // ── 업무 상세 ──
          { path: 'work-items/:key', element: <WorkItemDetail /> },

          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
      // ── 시스템 관리 (CR-046) — WS 컨텍스트 셸(AppShell) 밖 별도 레이아웃. 전역 설정. ──
      {
        path: '/admin',
        element: <SystemAdminShell />,
        children: [
          { index: true, element: <Navigate to="measure-units" replace /> },
          { path: 'measure-units', element: <MeasureUnitsPage /> },
          { path: 'field-schemes', element: <FieldSchemesPage /> },
          { path: 'workflows', element: <WorkflowsPage /> },
          { path: 'issue-types', element: <IssueTypesPage /> },
          { path: 'forms', element: <FormsPage /> },
          { path: 'users', element: <UsersPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}
