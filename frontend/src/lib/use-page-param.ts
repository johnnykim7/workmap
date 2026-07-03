// 목록 페이징 상태를 URL 쿼리(?page=)가 소유하도록 강제하는 공통 훅 (T3-3 "목록 페이징 상태" 규약).
// 상세 페이지 이탈 → 뒤로가기 시 목록 재마운트되어도 page가 URL에 있어 복원된다.
// useState(0)과 동일 시그니처([page, setPage])라 화면별 교체는 한 줄.
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * @param key URL 쿼리 키 (기본 'page'). 한 화면에 목록이 여럿이면 키를 분리한다.
 * @returns [page, setPage] — page는 0-based. setPage는 값 또는 updater 함수를 받는다.
 */
export function usePageParam(key = 'page'): [number, (next: number | ((prev: number) => number)) => void] {
  const [sp, setSp] = useSearchParams();

  const raw = sp.get(key);
  const parsed = raw != null ? Number.parseInt(raw, 10) : 0;
  const page = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;

  const setPage = useCallback(
    (next: number | ((prev: number) => number)) => {
      setSp(
        (prev) => {
          const cur = (() => {
            const r = prev.get(key);
            const n = r != null ? Number.parseInt(r, 10) : 0;
            return Number.isFinite(n) && n > 0 ? n : 0;
          })();
          const value = typeof next === 'function' ? next(cur) : next;
          const merged = new URLSearchParams(prev);
          if (value <= 0) merged.delete(key);
          else merged.set(key, String(value));
          return merged;
        },
        { replace: true },
      );
    },
    [key, setSp],
  );

  return [page, setPage];
}
