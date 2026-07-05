// 개인별 화면 테마 프리셋 — localStorage 저장(theme-store), 런타임 토큰 주입.
// 면(面) 2개를 묶은 프리셋: ① LNB 톤(사이드바+헤더) ② 포인트색(버튼·링크·활성·진행률·포커스).
// 본문 바탕(--background)·카드·상태색(--wm-status-*)은 테마로 바꾸지 않는다(가독성·의미색 보존).
//
// 적용 메커니즘: 선택 프리셋의 vars를 document.documentElement에 setProperty로 주입.
// ds-ui globals.css가 정의한 CSS 변수를 덮어쓰는 방식이라 컴포넌트는 무수정.
// ⚠️ ds-ui dist/style.css는 절대 재빌드/재import하지 않는다(LNB 깨짐 트랩 — workmap-tailwind-lnb-trap).

/** 프리셋이 주입하는 CSS 변수 묶음. 키 = CSS 변수명(앞의 -- 제외), 값 = 색. */
export interface ThemeVars {
  // ① 포인트색(Accent) — 강조/액션 전부
  primary: string;
  'primary-foreground': string;
  ring: string;
  // 본문 바탕 — 프리셋 색의 아주 연한 틴트(거의 흰색). 카드(--card=흰색)와 미세 단차.
  background: string;
  // ② LNB 톤(Sidebar) — 사이드바 + 헤더 한 세트
  sidebar: string;
  'sidebar-foreground': string;
  'sidebar-primary': string; // 활성 메뉴 배경
  'sidebar-primary-foreground': string;
  'sidebar-accent': string; // hover 배경
  'sidebar-accent-foreground': string;
  'sidebar-border': string;
}

export interface ThemePreset {
  id: string;
  /** 카드에 표시할 이름 */
  name: string;
  /** 한 줄 설명 */
  desc: string;
  /** LNB가 어두운 톤인지(카드 미리보기 표현용) */
  darkSidebar: boolean;
  vars: ThemeVars;
}

// 프리셋 6종 — LNB 톤·포인트색이 모두 제각각이라 카드 6장이 한눈에 다 다르게 보인다.
// 라이트 LNB는 포인트색 연한 틴트(흰색 겹침 방지), 다크 LNB는 색조 있는 짙은 톤.
// 활성 메뉴(sidebar-primary)는 포인트색 계열로, 글자는 배경 명도에 맞춰 지정.
export const THEME_PRESETS: ThemePreset[] = [
  {
    // 기본값(첫 항목) — DEFAULT_THEME_ID가 이 id를 가져간다.
    id: 'midnight', name: '미드나잇', desc: '짙은 네이비 사이드바 + 인디고 강조 — Slack식 다크', darkSidebar: true,
    vars: {
      primary: '#4f46e5', 'primary-foreground': '#ffffff', ring: '#6366f1',
      background: '#f6f7f9',
      sidebar: '#1e293b', 'sidebar-foreground': '#e2e8f0',
      'sidebar-primary': '#6366f1', 'sidebar-primary-foreground': '#ffffff',
      'sidebar-accent': '#334155', 'sidebar-accent-foreground': '#f8fafc',
      'sidebar-border': '#334155',
    },
  },
  {
    id: 'indigo', name: '인디고', desc: '연한 남색 사이드바 + 인디고 강조 — 깨끗·무난', darkSidebar: false,
    vars: {
      primary: '#4f46e5', 'primary-foreground': '#ffffff', ring: '#6366f1',
      background: '#fafaff',
      sidebar: '#f5f5fb', 'sidebar-foreground': '#1e1b4b',
      'sidebar-primary': '#4f46e5', 'sidebar-primary-foreground': '#ffffff',
      'sidebar-accent': '#e8e7f9', 'sidebar-accent-foreground': '#312e81',
      'sidebar-border': '#dedcf3',
    },
  },
  {
    id: 'teal', name: '틸', desc: '연한 청록 사이드바 + 청록 강조 — 생산성 툴 느낌', darkSidebar: false,
    vars: {
      primary: '#0d9488', 'primary-foreground': '#ffffff', ring: '#14b8a6',
      background: '#f7fdfb',
      sidebar: '#f0faf8', 'sidebar-foreground': '#134e4a',
      'sidebar-primary': '#0d9488', 'sidebar-primary-foreground': '#ffffff',
      'sidebar-accent': '#d9f2ee', 'sidebar-accent-foreground': '#0f766e',
      'sidebar-border': '#c8ebe5',
    },
  },
  {
    id: 'forest', name: '포레스트', desc: '짙은 그린 사이드바 + 에메랄드 강조', darkSidebar: true,
    vars: {
      primary: '#059669', 'primary-foreground': '#ffffff', ring: '#10b981',
      background: '#f5faf7',
      sidebar: '#14302a', 'sidebar-foreground': '#d1fae5',
      'sidebar-primary': '#10b981', 'sidebar-primary-foreground': '#04241d',
      'sidebar-accent': '#1f4a40', 'sidebar-accent-foreground': '#ecfdf5',
      'sidebar-border': '#1f4a40',
    },
  },
  {
    id: 'ocean', name: '오션', desc: '연한 파랑 사이드바 + 블루 강조 — Jira식', darkSidebar: false,
    vars: {
      primary: '#2563eb', 'primary-foreground': '#ffffff', ring: '#3b82f6',
      background: '#f8fbff',
      sidebar: '#eff5ff', 'sidebar-foreground': '#1e3a8a',
      'sidebar-primary': '#2563eb', 'sidebar-primary-foreground': '#ffffff',
      'sidebar-accent': '#dbe8fe', 'sidebar-accent-foreground': '#1e40af',
      'sidebar-border': '#cddffc',
    },
  },
  {
    id: 'rose', name: '로즈', desc: '연한 분홍 사이드바 + 로즈 강조 — 따뜻한 톤', darkSidebar: false,
    vars: {
      primary: '#e11d48', 'primary-foreground': '#ffffff', ring: '#f43f5e',
      background: '#fff8fa',
      sidebar: '#fff1f4', 'sidebar-foreground': '#881337',
      'sidebar-primary': '#e11d48', 'sidebar-primary-foreground': '#ffffff',
      'sidebar-accent': '#ffe0e6', 'sidebar-accent-foreground': '#9f1239',
      'sidebar-border': '#fbd0da',
    },
  },
];

export const DEFAULT_THEME_ID = THEME_PRESETS[0].id;

export function getPreset(id: string): ThemePreset {
  return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0];
}

/** 프리셋의 CSS 변수를 document에 주입. 테마 미적용 면(--background 등)은 건드리지 않음.
 * 다크 LNB 프리셋은 data-sidebar-dark 속성을 세팅 → 헤더 보조텍스트 색 강제(main.css)는
 * 이 속성이 있을 때만 적용(라이트 프리셋의 muted 위계를 깨지 않기 위함). */
export function applyTheme(id: string): void {
  const preset = getPreset(id);
  const root = document.documentElement;
  for (const [key, value] of Object.entries(preset.vars)) {
    // --background는 테마로 바꾸지 않는다(주석 §3 의도) → ds-ui 기본 흰색 유지.
    // 회색 틴트를 주입하면 본문(--card로 덮음)은 괜찮아도 Dialog(bg-background)가 회색으로 샌다.
    if (key === 'background') continue;
    root.style.setProperty(`--${key}`, value);
  }
  if (preset.darkSidebar) {
    root.setAttribute('data-sidebar-dark', '');
  } else {
    root.removeAttribute('data-sidebar-dark');
  }
}
