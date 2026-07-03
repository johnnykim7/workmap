// usePageParam — 페이징 상태의 URL(?page=) 소유 검증 (T3-3 "목록 페이징 상태" 규약).
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { usePageParam } from './use-page-param';

function wrapper(initial: string) {
  return ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>
  );
}

describe('usePageParam', () => {
  it('URL에_page없음_0반환', () => {
    const { result } = renderHook(() => usePageParam(), { wrapper: wrapper('/search') });
    expect(result.current[0]).toBe(0);
  });

  it('URL의_page쿼리_파싱해서_반환', () => {
    const { result } = renderHook(() => usePageParam(), { wrapper: wrapper('/search?page=3') });
    expect(result.current[0]).toBe(3);
  });

  it('setPage_URL을_갱신', () => {
    const { result } = renderHook(() => usePageParam(), { wrapper: wrapper('/search') });
    act(() => result.current[1](2));
    expect(result.current[0]).toBe(2);
  });

  it('setPage_updater함수_지원', () => {
    const { result } = renderHook(() => usePageParam(), { wrapper: wrapper('/search?page=2') });
    act(() => result.current[1]((p) => p + 1));
    expect(result.current[0]).toBe(3);
  });

  it('setPage0_page키_제거_다른쿼리는_보존', () => {
    const { result } = renderHook(
      () => {
        const [page, setPage] = usePageParam();
        const loc = useLocation();
        return { page, setPage, search: loc.search };
      },
      { wrapper: wrapper('/search?keyword=oauth&page=3') },
    );
    expect(result.current.page).toBe(3);
    act(() => result.current.setPage(0));
    // page 키만 사라지고 keyword는 유지
    expect(result.current.search).toContain('keyword=oauth');
    expect(result.current.search).not.toContain('page=');
    expect(result.current.page).toBe(0);
  });

  it('음수나_비정상값_0으로_보정', () => {
    const { result } = renderHook(() => usePageParam(), { wrapper: wrapper('/search?page=abc') });
    expect(result.current[0]).toBe(0);
  });

  it('커스텀_키_지원', () => {
    const { result } = renderHook(() => usePageParam('p'), { wrapper: wrapper('/x?p=4') });
    expect(result.current[0]).toBe(4);
  });
});
