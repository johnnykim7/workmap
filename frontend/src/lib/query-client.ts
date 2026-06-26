import { QueryClient } from '@tanstack/react-query';

// TanStack Query 전역 클라이언트.
// Sprint1은 골격만 — 실제 fetch는 Sprint2 인증/프로젝트 API부터.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
