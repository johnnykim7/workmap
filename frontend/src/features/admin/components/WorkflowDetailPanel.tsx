// 워크플로 상세 패널 (WMP-ADM-003) — 선택된 워크플로의 상태 목록 + 전이(화이트리스트) 편집.
// 전이는 from/to 상태를 Select로 골라 추가. 상태/전이 삭제는 ConfirmDialog 경유.
import { useState } from 'react';
import {
  Button, Badge, Spinner,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@therecommerce/ds-ui';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { Field } from '@/components/common/field';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { WorkflowStatusDialog } from './WorkflowStatusDialog';
import {
  useWorkflowStatuses, useWorkflowTransitions, useWorkflowDetailMutations,
} from '../hooks';
import type { WorkflowResponse, WorkflowStatusResponse, WorkflowTransitionResponse } from '../api';

interface Props {
  workflow: WorkflowResponse;
}

export function WorkflowDetailPanel({ workflow }: Props) {
  const wfId = workflow.id;
  const { data: statuses = [], isPending: statusesPending } = useWorkflowStatuses(wfId);
  const { data: transitions = [], isPending: transitionsPending } = useWorkflowTransitions(wfId);
  const { addStatus, removeStatus, addTransition, removeTransition } = useWorkflowDetailMutations(wfId);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deletingStatus, setDeletingStatus] = useState<WorkflowStatusResponse | null>(null);
  const [deletingTransition, setDeletingTransition] = useState<WorkflowTransitionResponse | null>(null);

  const [fromId, setFromId] = useState<string>('');
  const [toId, setToId] = useState<string>('');

  const statusLabel = (id: number) => {
    const s = statuses.find((x) => x.id === id);
    return s ? `${s.label} (${s.code})` : `#${id}`;
  };

  function addTransitionClick() {
    if (!fromId || !toId || fromId === toId) return;
    addTransition.mutate(
      { fromStatusId: Number(fromId), toStatusId: Number(toId) },
      { onSuccess: () => { setFromId(''); setToId(''); } },
    );
  }

  return (
    <div className="space-y-6">
      {/* 상태 목록 */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">상태</h3>
          <Button
            variant="primary" size="sm" className="gap-1"
            disabled={workflow.isSystem} onClick={() => setStatusDialogOpen(true)}
          >
            <Plus className="size-4" /> 상태 추가
          </Button>
        </div>

        {statusesPending ? (
          <div className="flex justify-center py-6"><Spinner className="size-5" /></div>
        ) : statuses.length === 0 ? (
          <p className="rounded-md border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
            상태가 없습니다.
          </p>
        ) : (
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>라벨</TableHead>
                  <TableHead>코드</TableHead>
                  <TableHead>공통 상태</TableHead>
                  <TableHead>플래그</TableHead>
                  <TableHead className="w-16 text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statuses.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.label}</TableCell>
                    <TableCell className="text-muted-foreground">{s.code}</TableCell>
                    <TableCell className="text-muted-foreground">{s.commonStatus}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {s.isStart && <Badge variant="secondary">시작</Badge>}
                        {s.isDone && <Badge variant="success">완료</Badge>}
                        {s.isApproval && <Badge variant="warning">승인{s.approverRole ? `:${s.approverRole}` : ''}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive" size="sm"
                        disabled={workflow.isSystem} onClick={() => setDeletingStatus(s)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* 전이(화이트리스트) */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-foreground">전이(화이트리스트)</h3>

        {!workflow.isSystem && statuses.length >= 2 && (
          <div className="mb-3 flex flex-wrap items-end gap-2 rounded-md border border-border p-3">
            <Field label="From">
              <Select value={fromId} onValueChange={setFromId}>
                <SelectTrigger className="w-44"><SelectValue placeholder="시작 상태" /></SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.label} ({s.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <ArrowRight className="mb-2 size-4 text-muted-foreground" />
            <Field label="To">
              <Select value={toId} onValueChange={setToId}>
                <SelectTrigger className="w-44"><SelectValue placeholder="도착 상태" /></SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.label} ({s.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Button
              variant="primary" size="sm" className="mb-0.5 gap-1"
              disabled={!fromId || !toId || fromId === toId || addTransition.isPending}
              onClick={addTransitionClick}
            >
              {addTransition.isPending && <Spinner className="size-4" />}
              <Plus className="size-4" /> 전이 추가
            </Button>
          </div>
        )}

        {transitionsPending ? (
          <div className="flex justify-center py-6"><Spinner className="size-5" /></div>
        ) : transitions.length === 0 ? (
          <p className="rounded-md border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
            정의된 전이가 없습니다.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {transitions.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className="font-medium">{statusLabel(t.fromStatusId)}</span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                  <span className="font-medium">{statusLabel(t.toStatusId)}</span>
                </span>
                <Button
                  variant="destructive" size="sm"
                  disabled={workflow.isSystem} onClick={() => setDeletingTransition(t)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <WorkflowStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        busy={addStatus.isPending}
        onSubmit={(body) => addStatus.mutate(body, { onSuccess: () => setStatusDialogOpen(false) })}
      />

      <ConfirmDialog
        open={!!deletingStatus}
        onOpenChange={(o) => !o && setDeletingStatus(null)}
        title="상태 삭제"
        description={deletingStatus ? `'${deletingStatus.label}' 상태를 삭제합니다. 관련 전이도 함께 사라집니다.` : ''}
        confirmLabel="삭제"
        busy={removeStatus.isPending}
        onConfirm={() => deletingStatus && removeStatus.mutate(deletingStatus.id, { onSuccess: () => setDeletingStatus(null) })}
      />

      <ConfirmDialog
        open={!!deletingTransition}
        onOpenChange={(o) => !o && setDeletingTransition(null)}
        title="전이 삭제"
        description={deletingTransition
          ? `'${statusLabel(deletingTransition.fromStatusId)} → ${statusLabel(deletingTransition.toStatusId)}' 전이를 삭제합니다.`
          : ''}
        confirmLabel="삭제"
        busy={removeTransition.isPending}
        onConfirm={() => deletingTransition && removeTransition.mutate(deletingTransition.id, { onSuccess: () => setDeletingTransition(null) })}
      />
    </div>
  );
}
