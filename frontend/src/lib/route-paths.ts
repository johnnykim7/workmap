// 중앙 라우트 경로 정의 (T3-3 §9.1 — Jira식 글로벌 LNB + /projects/:key/탭)
// 화면·LNB·라우터가 모두 이 상수를 참조한다. 경로 변경은 여기 한 곳만.

/** 프로젝트 본문 가로 탭 키 (Jira식). 유형 프리셋이 노출 조합을 정한다(§7). */
export type ProjectTab =
  | 'summary'
  | 'list'
  | 'board'
  | 'backlog'
  | 'timeline'
  | 'calendar'
  | 'attachments'
  | 'approvals'
  | 'reports';

export const ROUTES = {
  login: '/login',
  // CR-027 — 공개(초대 수락·비번 찾기) + 인증(비번 변경)
  inviteAccept: '/invite/accept',
  passwordForgot: '/password/forgot',
  passwordReset: '/password/reset',
  signupRequest: '/signup-request',
  accountProfile: '/account/profile', // CR-047 — 내 프로필(프로필 사진)
  accountPassword: '/account/password',
  accountNotifications: '/account/notifications', // CR-028 — 알림 수신 설정
  accountTheme: '/account/theme', // 개인 화면 테마(프리셋)
  selectWorkspace: '/select-workspace',
  home: '/',
  inbox: '/inbox',
  search: '/search',
  chat: '/chat',
  chatChannel: (channelId: number | string) => `/chat/${channelId}`,
  projects: '/projects',

  project: (key: string, tab: ProjectTab = 'summary') => `/projects/${key}/${tab}`,
  // 탭 없는 프로젝트 루트. LNB 하이라이트 매칭용(어느 탭이든 startsWith로 잡히도록).
  // 클릭 시엔 /projects/:key index가 summary로 리다이렉트한다(App.tsx).
  projectRoot: (key: string) => `/projects/${key}`,
  workItem: (key: string) => `/work-items/${key}`,
  workspaceMembers: (wsId: number | string) => `/workspaces/${wsId}/members`,
  // CR-046 — WS 자신의 설정(일반/멤버/채널/보관). LNB "설정" 자리.
  workspaceSettings: (wsId: number | string) => `/workspaces/${wsId}/settings`,

  admin: {
    measureUnits: '/admin/measure-units',
    fieldSchemes: '/admin/field-schemes',
    workflows: '/admin/workflows',
    issueTypes: '/admin/issue-types',
    forms: '/admin/forms',
    users: '/admin/users',
  },
} as const;
