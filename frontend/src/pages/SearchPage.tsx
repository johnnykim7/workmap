// 검색 결과 (/search) — 전사 전체 텍스트 검색 + 필터 + 퀵필터(§13.9). Sprint5.
// 데이터=실 BE GET /work-items(projectId 없이 가시범위 전체, BIZ-108). 행 클릭→업무 상세.
// 회사 홈 카드 도착지(?quick=blocked|unassigned). keyword는 제목·key·설명·댓글 검색.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button, SearchInput, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@therecommerce/ds-ui';
import { SearchX, AlertTriangle } from 'lucide-react';
import { PageHead, TypeOption } from '@/components/badges';
import { EmptyState } from '@/components/common/empty-state';
import { PageShell } from '@/components/common/page-shell';
import { Pager } from '@/components/common/pager';
import { usePageParam } from '@/lib/use-page-param';
import { WorkListTableSkeleton } from '@/components/common/skeletons';
import { WorkItemTable } from '@/features/workitem/components/WorkItemTable';
import { useSearch } from '@/features/search/hooks';
import type { SearchParams } from '@/features/search/api';
import { SavedFilterBar } from '@/features/saved-filter/SavedFilterBar';
import type { SearchFilterState, QuickKey } from '@/features/saved-filter/filter-codec';
import { useUserSearch } from '@/features/members/hooks';
import { useAuthStore } from '@/store/auth-store';
import { ROUTES } from '@/lib/route-paths';
import {
  ISSUE_TYPE_LABEL, WORK_STATUS_LABEL, PRIORITY_LABEL,
  type IssueType, type WorkStatus, type Priority,
} from '@/types/domain';
import type { WorkItemSortKey } from '@/features/workitem/list-api';

const ALL = 'ALL';
const PAGE_SIZE = 20;

const STATUS_OPTIONS: WorkStatus[] = [
  'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'RECEIVED', 'PROCESSING', 'HOLD', 'OPS_APPLIED',
];

// 퀵필터(§13.9): 내 항목 / 최근 업데이트 / 막힌 것 / 미배정. params 변형으로 적용.
type Quick = 'mine' | 'recent' | 'blocked' | 'unassigned';
const QUICKS: { key: Quick; label: string }[] = [
  { key: 'mine', label: '내 항목' },
  { key: 'recent', label: '최근 업데이트' },
  { key: 'blocked', label: '막힌 것' },
  { key: 'unassigned', label: '미배정' },
];

export function SearchPage() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const me = useAuthStore((s) => s.user);

  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState<Pick<SearchParams, 'issueType' | 'commonStatus' | 'priority' | 'label'>>({});
  const [quick, setQuick] = useState<Set<Quick>>(new Set());
  const [page, setPage] = usePageParam();

  // 회사 홈 카드 도착지: /search?quick=blocked|unassigned 진입 시 해당 퀵필터 선점.
  useEffect(() => {
    const q = sp.get('quick');
    if (q && QUICKS.some((x) => x.key === q)) {
      setQuick(new Set([q as Quick]));
      sp.delete('quick');
      setSp(sp, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 전사 담당자 이름 해소(전체 사용자 — 키워드 빈값=전체).
  const { data: users = [] } = useUserSearch('');
  const userName = useMemo(() => {
    const m = new Map(users.map((u) => [u.id, u.name]));
    return (id?: number | null) => (id == null ? undefined : m.get(id));
  }, [users]);

  // 퀵필터 → params 변형. (미배정은 BE 파라미터 부재로 클라 보정)
  const params: SearchParams = useMemo(() => {
    const p: SearchParams = {
      keyword: keyword.trim() || undefined,
      ...filter,
      page,
      size: PAGE_SIZE,
    };
    if (quick.has('blocked')) p.flagged = true; // CR-040: 막힘은 상태 아님 → flagged 필터
    if (quick.has('mine') && me) p.assigneeId = me.id;
    if (quick.has('recent')) { p.sort = 'updatedAt' as WorkItemSortKey; p.direction = 'DESC'; }
    return p;
  }, [keyword, filter, quick, page, me]);

  const filterUnassigned = quick.has('unassigned');

  const { data, isPending, isError, isPlaceholderData } = useSearch(params);
  const rawItems = data?.items ?? [];
  const items = filterUnassigned ? rawItems.filter((w) => w.assigneeId == null) : rawItems;
  const totalPages = data?.totalPages ?? 0;

  function patchFilter(patch: Partial<typeof filter>) {
    setFilter((f) => ({ ...f, ...patch }));
    setPage(0);
  }
  function toggleQuick(k: Quick) {
    setQuick((s) => {
      const next = new Set(s);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
    setPage(0);
  }

  // 저장 필터(WMP-VIEW-004): 현재 조건 직렬화 + 저장 필터 적용.
  const currentFilterState: SearchFilterState = useMemo(() => ({
    keyword: keyword.trim() || undefined,
    issueType: filter.issueType,
    commonStatus: filter.commonStatus,
    priority: filter.priority,
    label: filter.label,
    quick: [...quick],
  }), [keyword, filter, quick]);

  function applySavedFilter(s: SearchFilterState) {
    setKeyword(s.keyword ?? '');
    setFilter({ issueType: s.issueType, commonStatus: s.commonStatus, priority: s.priority, label: s.label });
    setQuick(new Set<QuickKey>(s.quick ?? []));
    setPage(0);
  }

  const noop = () => {};
  const emptySet = useMemo(() => new Set<number>(), []);

  // 헤더부(제목·검색·필터·저장필터·퀵필터)는 고정, 표만 스크롤(PageShell 공통 규약).
  const header = (
    <>
      <PageHead title="검색" desc="제목·설명·댓글 전체 텍스트 검색" />

      {/* 검색 바 + 필터 */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput
          className="w-80"
          placeholder="제목·설명·댓글 검색"
          value={keyword}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setKeyword(e.target.value); setPage(0); }}
        />
        <Select value={filter.issueType ?? ALL}
          onValueChange={(v) => patchFilter({ issueType: v === ALL ? undefined : (v as IssueType) })}>
          <SelectTrigger className="w-32"><SelectValue placeholder="유형" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>모든 유형</SelectItem>
            {(Object.keys(ISSUE_TYPE_LABEL) as IssueType[]).map((t) => (
              <SelectItem key={t} value={t}><TypeOption type={t} /></SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filter.commonStatus ?? ALL}
          onValueChange={(v) => patchFilter({ commonStatus: v === ALL ? undefined : (v as WorkStatus) })}>
          <SelectTrigger className="w-32"><SelectValue placeholder="상태" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>모든 상태</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{WORK_STATUS_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filter.priority ?? ALL}
          onValueChange={(v) => patchFilter({ priority: v === ALL ? undefined : (v as Priority) })}>
          <SelectTrigger className="w-32"><SelectValue placeholder="우선순위" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>모든 우선순위</SelectItem>
            {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
              <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <SearchInput
          className="w-40"
          placeholder="라벨"
          value={filter.label ?? ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            patchFilter({ label: e.target.value || undefined })}
        />
      </div>

      {/* 저장 필터 (WMP-VIEW-004) */}
      <SavedFilterBar current={currentFilterState} onApply={applySavedFilter} />

      {/* 퀵필터 */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {QUICKS.map((q) => (
          <Button
            key={q.key}
            variant={quick.has(q.key) ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 rounded-full text-xs"
            onClick={() => toggleQuick(q.key)}
          >
            {q.label}
          </Button>
        ))}
      </div>
    </>
  );

  // 페이저는 하단 고정(footer 슬롯) — 표 행만 스크롤. 결과 있을 때만 노출.
  const footer =
    !isPending && !isError && items.length > 0 ? (
      <Pager page={page} totalPages={totalPages} onPage={setPage} busy={isPlaceholderData} />
    ) : undefined;

  return (
    <PageShell header={header} footer={footer}>
      {isPending ? (
        <WorkListTableSkeleton />
      ) : isError ? (
        <EmptyState
          icon={<AlertTriangle className="size-6" />}
          title="검색에 실패했습니다"
          description="잠시 후 다시 시도해 주세요."
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<SearchX className="size-6" />}
          title="검색 결과가 없습니다"
          description="검색어나 필터를 조정해 보세요."
        />
      ) : (
        <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : ''}>
          <WorkItemTable
            items={items}
            assigneeName={userName}
            selectedIds={emptySet}
            onToggle={noop}
            onToggleAll={noop}
            direction="DESC"
            onSort={noop}
            onRowClick={(it) => navigate(ROUTES.workItem(it.key))}
          />
        </div>
      )}
    </PageShell>
  );
}
