import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@therecommerce/ds-ui';
import './styles/main.css';
import { App } from './App';
import { FileViewerProvider } from '@/components/common/file-viewer';
import { queryClient } from '@/lib/query-client';
import { applyTheme, DEFAULT_THEME_ID } from '@/lib/themes';

// 개인 테마 — 첫 페인트 전에 저장된 프리셋을 주입(FOUC 방지). store rehydrate 전에 직접 읽음.
// zustand persist 키 'workmap-theme' → { state: { themeId }, version }.
(function bootstrapTheme() {
  try {
    const raw = localStorage.getItem('workmap-theme');
    const id = raw ? JSON.parse(raw)?.state?.themeId : null;
    applyTheme(id ?? DEFAULT_THEME_ID);
  } catch {
    applyTheme(DEFAULT_THEME_ID);
  }
})();

// MSW — dev에서 T3-2 계약 목킹(실 BE 계약 미러). 실 BE 연동 시:
//   VITE_USE_MOCK=false pnpm dev  → MSW 끄고 vite proxy로 BE(8186) 호출.
// BE가 완전히 안정되면 이 블록 + src/mocks/ 제거.
async function enableMocking() {
  if (!import.meta.env.DEV) return;
  if (import.meta.env.VITE_USE_MOCK === 'false') return;
  const { worker } = await import('@/mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <FileViewerProvider>
          <App />
        </FileViewerProvider>
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </StrictMode>,
  );
});
