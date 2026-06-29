import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_THEME_ID, applyTheme } from '@/lib/themes';

// 개인별 화면 테마 — 선택한 프리셋 id를 localStorage에 기억(기기/브라우저 단위, BE 무관).
// setTheme 시 즉시 document에 토큰 주입 → 전 화면 반영. persist rehydrate 후에도 1회 주입(아래).
interface ThemeState {
  themeId: string;
  setTheme: (id: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeId: DEFAULT_THEME_ID,
      setTheme: (id) => {
        applyTheme(id);
        set({ themeId: id });
      },
    }),
    {
      name: 'workmap-theme',
      // 저장된 값으로 복원된 직후 토큰을 주입(앱 첫 로드 시 자동 적용).
      onRehydrateStorage: () => (state) => {
        applyTheme(state?.themeId ?? DEFAULT_THEME_ID);
      },
    },
  ),
);
