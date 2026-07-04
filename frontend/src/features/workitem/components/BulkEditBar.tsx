// 벌크편집 바(§9.5, WMP-WI-015) — 선택 N건 일괄 변경. 액션 하나씩 적용(항목별 FSM 검증·실패 분리 보고).
// 상태=워크플로 컬럼 Select(순수 상태 전이 — 막힘은 상태 아님, CR-040), 담당자/스프린트/우선순위 Select.
import {
  Button, Spinner,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@therecommerce/ds-ui';
import { X } from 'lucide-react';
import { PRIORITY_LABEL, type Priority, type ProjectMember, type Sprint } from '@/types/domain';
import { useBoard } from '@/features/board/hooks';
import { useBulkUpdate } from '../list-hooks';

const NONE = '__none__';

interface Props {
  projectId: number;
  selectedIds: number[];
  members: ProjectMember[];
  sprints: Sprint[];
  onClear: () => void;
}

export function BulkEditBar({ projectId, selectedIds, members, sprints, onClear }: Props) {
  const { data: board } = useBoard(projectId);
  // CR-039: 보드가 groups[]로 바뀜. 상태 컬럼 목록은 첫 그룹(같은 워크플로라 그룹 간 컬럼 집합 동일).
  const columns = board?.groups?.[0]?.columns ?? [];
  const bulk = useBulkUpdate(projectId);

  const ids = selectedIds;
  const busy = bulk.isPending;

  function run(body: Parameters<typeof bulk.mutate>[0], onDone?: () => void) {
    bulk.mutate(body, { onSuccess: () => onDone?.(), onSettled: () => onClear() });
  }

  function onStatus(v: string) {
    run({ ids, toStatusId: Number(v) });
  }

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
      <span className="text-sm font-medium">{ids.length}건 선택</span>
      <span className="text-muted-foreground">·</span>

      {/* 상태 */}
      <Select value="" onValueChange={onStatus} disabled={busy || columns.length === 0}>
        <SelectTrigger className="h-8 w-32"><SelectValue placeholder="상태 변경" /></SelectTrigger>
        <SelectContent>
          {columns.map((c) => <SelectItem key={c.statusId} value={String(c.statusId)}>{c.label}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* 담당자 */}
      <Select value="" onValueChange={(v) => run({ ids, changeAssignee: true, assigneeId: v === NONE ? null : Number(v) })} disabled={busy}>
        <SelectTrigger className="h-8 w-32"><SelectValue placeholder="담당자 변경" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>미배정</SelectItem>
          {members.map((m) => <SelectItem key={m.userId} value={String(m.userId)}>{m.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* 스프린트 */}
      <Select value="" onValueChange={(v) => run({ ids, changeSprint: true, sprintId: v === NONE ? null : Number(v) })} disabled={busy}>
        <SelectTrigger className="h-8 w-32"><SelectValue placeholder="스프린트 변경" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>백로그</SelectItem>
          {sprints.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* 우선순위 */}
      <Select value="" onValueChange={(v) => run({ ids, priority: v as Priority })} disabled={busy}>
        <SelectTrigger className="h-8 w-32"><SelectValue placeholder="우선순위 변경" /></SelectTrigger>
        <SelectContent>
          {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>)}
        </SelectContent>
      </Select>

      {busy && <Spinner className="size-4" />}

      <Button variant="ghost" size="sm" className="ml-auto gap-1" onClick={onClear} disabled={busy}>
        <X className="size-4" /> 선택 해제
      </Button>
    </div>
  );
}
