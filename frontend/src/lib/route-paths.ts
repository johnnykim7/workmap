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
  | 'approvals'
  | 'reports';

export const ROUTES = {
  login: '/login',
  home: '/',
  inbox: '/inbox',
  search: '/search',
  projects: '/projects',

  project: (key: string, tab: ProjectTab = 'summary') => `/projects/${key}/${tab}`,
  workItem: (key: string) => `/work-items/${key}`,

  admin: {
    measureUnits: '/admin/measure-units',
    fieldSchemes: '/admin/field-schemes',
    workflows: '/admin/workflows',
    forms: '/admin/forms',
  },
} as const;
