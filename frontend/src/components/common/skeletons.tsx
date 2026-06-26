// 공통 로딩 스켈레톤 (CLAUDE.md/T3-3 공통 UX 규약: 데이터 패칭은 스피너 대신 스켈레톤).
// ds-ui Skeleton 프리미티브로 화면별 골격 조립. 레이아웃 시프트 최소화.
import { Skeleton } from '@therecommerce/ds-ui';

/** 프로젝트 목록 카드 그리드 스켈레톤 */
export function ProjectCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border p-4">
          <div className="mb-3 flex items-center gap-2">
            <Skeleton className="size-8 rounded" />
            <div className="flex-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-1.5 h-3 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-5 w-16 rounded" />
            <Skeleton className="h-5 w-16 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** 멤버 목록 행 스켈레톤 */
export function MemberRowsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-md border border-border p-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-1 h-3 w-48" />
          </div>
          <Skeleton className="h-6 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}
