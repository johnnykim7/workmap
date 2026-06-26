// 회사홈 막힘/지연/미배정 패널(§9.2) — 상위 N건 미리보기 + 건수 배지.
// 로딩=Skeleton, 빈 상태=인라인 안내. 행은 WorkItemMiniRow(클릭→업무 상세).
import type { ReactNode } from 'react';
import { Skeleton } from '@therecommerce/ds-ui';
import { useDashboardList } from '../hooks';
import type { DashboardListKind } from '../api';
import { WorkItemMiniRow } from './WorkItemMiniRow';

const PREVIEW = 5;

export function DashboardListPanel({
  kind, title, icon, tone,
}: {
  kind: DashboardListKind;
  title: string;
  icon: ReactNode;
  tone?: 'red' | 'amber';
}) {
  const { data, isPending, isError } = useDashboardList(kind, PREVIEW);
  const items = data?.items ?? [];
  const total = data?.totalCount ?? 0;
  const countColor = tone === 'red' ? 'text-red-600' : tone === 'amber' ? 'text-amber-600' : 'text-foreground';

  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          {icon}
          {title}
        </div>
        {!isPending && !isError && (
          <span className={`text-sm font-semibold ${total > 0 ? countColor : 'text-muted-foreground'}`}>
            {total}
          </span>
        )}
      </div>

      {isPending ? (
        <div className="flex flex-col gap-1.5 p-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-6 rounded" />)}
        </div>
      ) : isError ? (
        <div className="px-3 py-6 text-center text-sm text-muted-foreground">불러오지 못했습니다.</div>
      ) : items.length === 0 ? (
        <div className="px-3 py-6 text-center text-sm text-muted-foreground">해당 업무가 없습니다.</div>
      ) : (
        <div className="divide-y divide-border">
          {items.map((it) => <WorkItemMiniRow key={it.id} item={it} />)}
          {total > items.length && (
            <div className="px-3 py-1.5 text-center text-[11px] text-muted-foreground">
              외 {total - items.length}건
            </div>
          )}
        </div>
      )}
    </div>
  );
}
