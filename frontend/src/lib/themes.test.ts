// 화면 테마 프리셋 단위테스트.
// 순수 로직(프리셋 정의·getPreset 폴백)은 환경 무관. applyTheme/store는 document·localStorage가
// 있을 때(jsdom) 검증 — 레포 공통 jsdom ERR_REQUIRE_ESM 이슈가 있으면 이 describe만 스킵될 수 있다.
import { describe, expect, it, beforeEach } from 'vitest';
import {
  THEME_PRESETS,
  DEFAULT_THEME_ID,
  getPreset,
  applyTheme,
  type ThemeVars,
} from './themes';

const REQUIRED_KEYS: (keyof ThemeVars)[] = [
  'primary', 'primary-foreground', 'ring',
  'sidebar', 'sidebar-foreground', 'sidebar-primary',
  'sidebar-primary-foreground', 'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border',
];

describe('themes — 프리셋 정의', () => {
  it('프리셋_6종_정의됨', () => {
    expect(THEME_PRESETS).toHaveLength(6);
  });

  it('프리셋_id_중복없음', () => {
    const ids = THEME_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('기본값_첫프리셋', () => {
    expect(DEFAULT_THEME_ID).toBe(THEME_PRESETS[0].id);
  });

  it('모든프리셋_필수토큰_빠짐없음', () => {
    for (const p of THEME_PRESETS) {
      for (const k of REQUIRED_KEYS) {
        expect(p.vars[k], `${p.id}.${k}`).toBeTruthy();
      }
    }
  });

  it('darkSidebar_프리셋은_어두운_배경', () => {
    // 다크 프리셋의 sidebar는 라이트(#ffffff)와 달라야 함.
    for (const p of THEME_PRESETS.filter((x) => x.darkSidebar)) {
      expect(p.vars.sidebar.toLowerCase()).not.toBe('#ffffff');
    }
  });
});

describe('getPreset — 폴백', () => {
  it('존재하는id_그대로반환', () => {
    expect(getPreset('midnight').id).toBe('midnight');
  });
  it('없는id_첫프리셋폴백', () => {
    expect(getPreset('nonexistent').id).toBe(THEME_PRESETS[0].id);
  });
});

describe('applyTheme — document 주입', () => {
  // 레포 공통 jsdom ERR_REQUIRE_ESM으로 node 환경에서 돈다 → document를 최소 모킹.
  // setProperty/getPropertyValue + setAttribute/hasAttribute/removeAttribute만 흉내.
  beforeEach(() => {
    if (typeof document !== 'undefined' && document.documentElement) return; // jsdom이면 그대로
    const props = new Map<string, string>();
    const attrs = new Map<string, string>();
    const el = {
      style: {
        setProperty: (k: string, v: string) => props.set(k, v),
        getPropertyValue: (k: string) => props.get(k) ?? '',
        removeAttribute: () => props.clear(),
      },
      setAttribute: (k: string, v: string) => attrs.set(k, v),
      removeAttribute: (k: string) => attrs.delete(k),
      hasAttribute: (k: string) => attrs.has(k),
    };
    (globalThis as unknown as { document: unknown }).document = { documentElement: el };
  });

  it('선택프리셋_토큰_documentElement에_주입', () => {
    const target = getPreset('teal');
    applyTheme('teal');
    const style = document.documentElement.style;
    expect(style.getPropertyValue('--primary')).toBe(target.vars.primary);
    expect(style.getPropertyValue('--sidebar')).toBe(target.vars.sidebar);
  });

  it('다크프리셋_data-sidebar-dark_세팅', () => {
    applyTheme('midnight');
    expect(document.documentElement.hasAttribute('data-sidebar-dark')).toBe(true);
  });

  it('라이트프리셋_data-sidebar-dark_제거', () => {
    applyTheme('midnight'); // 먼저 세팅
    applyTheme('indigo'); // 라이트로 전환 → 제거되어야
    expect(document.documentElement.hasAttribute('data-sidebar-dark')).toBe(false);
  });
});
