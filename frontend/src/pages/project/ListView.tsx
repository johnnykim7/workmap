// 목록 뷰 (/projects/:key/list) — §9.5. 표 ⇄ 분할뷰 토글 + 퀵필터 + 정렬 + 벌크편집.
// 분할 모드 우측은 §9.3 업무 상세 패널 재사용. 데이터=실 BE GET /work-items(통합목록), PATCH /work-items/bulk.
import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@therecommerce/ds-ui';
import { ROUTES } from '@/lib/route-paths';
import { Table as TableIcon, Columns2, AlertTriangle, ListX } from 'lucide-react';
import { useProjectByKey } from '@/features/projects/hooks';
import { useMembers } from '@/features/members/hooks';
import { useAssigneeName } from '@/features/members/use-assignee-name';
import { useSprints } from '@/features/agile/hooks';
import { useWorkItems } from '@/features/workitem/list-hooks';
import type { WorkItemListParams, WorkItemSortKey } from '@/features/workitem/list-api';
import { WorkItemTable } from '@/features/workitem/components/WorkItemTable';
import { WorkListFilterBar } from '@/features/workitem/components/WorkListFilterBar';
import { BulkEditBar } from '@/features/workitem/components/BulkEditBar';
import { SplitView } from '@/features/workitem/components/SplitView';
import { WorkListTableSkeleton } from '@/components/common/skeletons';
import { EmptyState } from '@/components/common/empty-state';
import { Pager } from '@/components/common/pager';
import { usePageParam } from '@/lib/use-page-param';
import { PageHead } from '@/components/badges';
import type { WorkItemResponse } from '@/types/domain';

type Mode = 'table' | 'split';
const PAGE_SIZE = 20;

export function ListView() {
  const { key = '' } = useParams();
  const navigate = useNavigate();
  const { data: project, isPending: projectPending } = useProjectByKey(key);
  const projectId = project?.id;

  const { data: members = [] } = useMembers(projectId);
  const { data: sprints = [] } = useSprints(projectId);
  const assigneeName = useAssigneeName(projectId);

  const [mode, setMode] = useState<Mode>('table');
  const [page, setPage] = usePageParam();
  const [filter, setFilter] = useState<Omit<WorkItemListParams, 'projectId' | 'page' | 'size'>>({
    sort: 'createdAt', direction: 'DESC',
  });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [splitSelected, setSplitSelected] = useState<WorkItemResponse | undefined>();

  const params: WorkItemListParams = useMemo(
    () => ({ projectId: projectId!, page, size: PAGE_SIZE, ...filter }),
    [projectId, page, filter],
  );
  const { data, isPending, isError, isPlaceholderData } = useWorkItems(params, !!projectId);

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;

  function patchFilter(patch: Partial<WorkItemListParams>) {
    setFilter((f) => ({ ...f, ...patch }));
    setPage(0);
    setSelectedIds(new Set());
  }

  function toggleSort(k: WorkItemSortKey) {
    setFilter((f) => ({
      ...f,
      sort: k,
      direction: f.sort === k && f.direction === 'ASC' ? 'DESC' : 'ASC',
    }));
    setPage(0);
  }

  function toggle(id: number) {
    setSelectedIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelectedIds((s) => {
      const allOn = items.length > 0 && items.every((i) => s.has(i.id));
      return allOn ? new Set() : new Set(items.map((i) => i.id));
    });
  }

  if (projectPending || (projectId && isPending && !data)) return <WorkListTableSkeleton />;

  if (isError) {
    return (
      <EmptyState
        icon={<AlertTriangle className="size-6" />}
        title="목록을 불러오지 못했습니다"
        description="잠시 후 다시 시도해 주세요."
      />
    );
  }

  return (
    <div>
      <PageHead
        title="목록"
        actions={
          <div className="inline-flex rounded-md border border-border p-0.5">
            <Button
              variant={mode === 'table' ? 'secondary' : 'ghost'}
              size="sm" className="gap-1" onClick={() => setMode('table')}
            >
              <TableIcon className="size-4" /> 표
            </Button>
            <Button
              variant={mode === 'split' ? 'secondary' : 'ghost'}
              size="sm" className="gap-1" onClick={() => setMode('split')}
            >
              <Columns2 className="size-4" /> 분할
            </Button>
          </div>
        }
      />

      <WorkListFilterBar params={params} members={members} onChange={patchFilter} />

      {mode === 'table' && selectedIds.size > 0 && (
        <BulkEditBar
          projectId={projectId!}
          selectedIds={[...selectedIds]}
          members={members}
          sprints={sprints}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<ListX className="size-6" />}
          title="표시할 업무가 없습니다"
          description="필터를 조정하거나 새 업무를 만들어 보세요."
        />
      ) : (
        <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : ''}>
          {mode === 'table' ? (
            <WorkItemTable
              items={items}
              assigneeName={assigneeName}
              selectedIds={selectedIds}
              onToggle={toggle}
              onToggleAll={toggleAll}
              sort={filter.sort}
              direction={filter.direction ?? 'DESC'}
              onSort={toggleSort}
              onRowClick={(it) => navigate(ROUTES.workItem(it.key))}
            />
          ) : (
            <SplitView
              items={items}
              sprints={sprints}
              selected={splitSelected}
              onSelect={setSplitSelected}
            />
          )}
          <Pager page={page} totalPages={totalPages} onPage={setPage} busy={isPlaceholderData} />
        </div>
      )}
    </div>
  );
}
