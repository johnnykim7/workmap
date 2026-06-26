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

/** 칸반 보드 스켈레톤 — 컬럼 3개 + 카드 placeholder(실제 레이아웃 골격) */
export function BoardSkeleton({ columns = 3 }: { columns?: number }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {Array.from({ length: columns }).map((_, c) => (
        <div key={c} className="flex w-72 shrink-0 flex-col gap-2 rounded-lg bg-muted/40 p-2">
          <div className="flex items-center justify-between px-1 py-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="size-5 rounded-full" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-md border border-border bg-card p-2.5">
              <Skeleton className="mb-2 h-3 w-12" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** 백로그 스켈레톤 — 스프린트 헤더 + 항목 행 placeholder */
export function BacklogSkeleton({ sections = 2 }: { sections?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: sections }).map((_, s) => (
        <div key={s} className="rounded-md border border-border">
          <div className="flex items-center gap-3 rounded-t-md bg-muted/60 px-3 py-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="ml-auto h-7 w-24 rounded" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 border-b border-border px-2 py-2 last:border-b-0">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="size-6 rounded-full" />
            </div>
          ))}
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

/** 업무 상세 스켈레톤 — 좌 본문(제목/블록) + 우 패널 필드 행(§9.3) */
export function WorkItemDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Skeleton className="h-5 w-12 rounded" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-24 w-full rounded" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-20 w-full rounded" />
      </div>
      <div className="w-full shrink-0 space-y-3 rounded-lg border border-border p-3 lg:w-80">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[5.5rem_1fr] items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-full rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** 통합 목록 표 스켈레톤 — 헤더 + 행 8개 회색 바(§9.5) */
export function WorkListTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center gap-3 border-b border-border px-3 py-2.5">
        {['w-6', 'w-12', 'w-20', 'flex-1', 'w-20', 'w-24', 'w-16', 'w-20'].map((w, i) => (
          <Skeleton key={i} className={`h-4 ${w}`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-3 px-3 py-2.5">
          <Skeleton className="size-4 rounded" />
          <Skeleton className="h-5 w-12 rounded" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-5 w-20 rounded" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
