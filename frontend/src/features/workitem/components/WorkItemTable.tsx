// 통합 목록 표(§9.5) — ds-ui Table. 선택 체크박스 + 정렬 헤더 + 행 클릭.
// 인라인 변경(상태/담당자)은 BulkEditBar/상세에서 처리. 표는 선택·정렬·이동에 집중(과밀 방지).
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Checkbox,
} from '@therecommerce/ds-ui';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { StatusBadge, TypeBadge, PriorityBadge, Avatar2 } from '@/components/badges';
import { fmtDate } from '@/lib/date';
import { type WorkItemResponse } from '@/types/domain';
import type { WorkItemSortKey, SortDirection } from '../list-api';

interface Props {
  items: WorkItemResponse[];
  assigneeName: (id?: number | null) => string | undefined;
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
  onToggleAll: () => void;
  sort?: WorkItemSortKey;
  direction: SortDirection;
  onSort: (key: WorkItemSortKey) => void;
  onRowClick: (item: WorkItemResponse) => void;
  activeId?: number; // 분할뷰에서 현재 선택된 행 강조
}

export function WorkItemTable({
  items, assigneeName, selectedIds, onToggle, onToggleAll,
  sort, direction, onSort, onRowClick, activeId,
}: Props) {
  const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id));
  const someSelected = items.some((i) => selectedIds.has(i.id));

  return (
    // sticky-table 마커: main.css가 ds-ui table-wrapper(overflow-auto)를 visible로 덮어
    // thead의 sticky top-0이 바깥 스크롤 컨테이너(PageShell 본문) 기준으로 동작하게 한다.
    <div className="sticky-table rounded-lg border border-border">
    <Table>
      {/* 표 헤더 행은 스크롤 시 상단 고정(스크롤 컨테이너=PageShell 본문 기준). bg-card로 행이 비치지 않게. */}
      <TableHeader className="sticky top-0 z-10 bg-card">
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              checked={allSelected ? true : someSelected ? 'indeterminate' : false}
              onCheckedChange={onToggleAll}
              aria-label="전체 선택"
            />
          </TableHead>
          <TableHead className="w-16">유형</TableHead>
          <TableHead className="w-28">키</TableHead>
          <TableHead>제목</TableHead>
          <TableHead className="w-28">상태</TableHead>
          <TableHead className="w-28">담당자</TableHead>
          <SortHead label="우선순위" k="priority" sort={sort} direction={direction} onSort={onSort} className="w-24" />
          <SortHead label="기한" k="dueDate" sort={sort} direction={direction} onSort={onSort} className="w-28" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((it) => (
          <TableRow
            key={it.id}
            data-active={activeId === it.id || undefined}
            className={`cursor-pointer border-b border-border ${activeId === it.id ? 'bg-muted/60' : ''}`}
            onClick={() => onRowClick(it)}
          >
            <TableCell onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={selectedIds.has(it.id)}
                onCheckedChange={() => onToggle(it.id)}
                aria-label={`${it.key} 선택`}
              />
            </TableCell>
            <TableCell><TypeBadge type={it.issueType} withLabel={false} /></TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">{it.key}</TableCell>
            <TableCell className="max-w-0 truncate">{it.title}</TableCell>
            <TableCell><StatusBadge status={it.commonStatus} /></TableCell>
            <TableCell>
              <span className="flex items-center gap-1.5">
                <Avatar2 name={assigneeName(it.assigneeId)} />
                <span className="truncate text-xs text-muted-foreground">{assigneeName(it.assigneeId) ?? '미배정'}</span>
              </span>
            </TableCell>
            <TableCell><PriorityBadge priority={it.priority} withLabel /></TableCell>
            <TableCell className="text-xs text-muted-foreground">{fmtDate(it.dueDate)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  );
}

function SortHead({ label, k, sort, direction, onSort, className }: {
  label: string; k: WorkItemSortKey; sort?: WorkItemSortKey; direction: SortDirection;
  onSort: (key: WorkItemSortKey) => void; className?: string;
}) {
  const active = sort === k;
  return (
    <TableHead className={className}>
      <button type="button" className="inline-flex items-center gap-0.5 hover:text-foreground" onClick={() => onSort(k)}>
        {label}
        {active && (direction === 'ASC' ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />)}
      </button>
    </TableHead>
  );
}
