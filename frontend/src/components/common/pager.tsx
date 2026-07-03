// 공통 페이저 (T3-3 "목록 페이징 상태" 규약). 화면별 자체 페이저·인라인 페이저 복붙 금지.
// 표현만 담당(상태 미소유) — page는 usePageParam으로 URL이 소유한다.
import { Button } from '@therecommerce/ds-ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pager({ page, totalPages, onPage, busy }: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
  busy?: boolean;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-3 flex items-center justify-center gap-3">
      <Button variant="ghost" size="sm" disabled={busy || page <= 0} onClick={() => onPage(page - 1)}>
        <ChevronLeft className="size-4" /> 이전
      </Button>
      <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
      <Button variant="ghost" size="sm" disabled={busy || page >= totalPages - 1} onClick={() => onPage(page + 1)}>
        다음 <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
