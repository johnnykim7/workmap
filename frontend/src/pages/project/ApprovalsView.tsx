// 승인 탭 (/projects/:key/approvals) — §9.5. 운영형 워크플로 게이트 처리 화면.
// 토글: 승인 대기 / 내가 요청 / 모든 승인. 표: 업무·상태·담당자·승인자·작업(승인/거부). 행 클릭→상세.
// 데이터=실 BE GET /projects/{id}/approvals(decision 필터), POST /approvals/{id}/decision. 신규 BE 없음.
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button, Spinner,
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Textarea,
} from '@therecommerce/ds-ui';
import { AlertTriangle, ShieldCheck, Settings } from 'lucide-react';
import { useProjectByKey } from '@/features/projects/hooks';
import { useMembers } from '@/features/members/hooks';
import { useProjectItems } from '@/features/workitem/hooks';
import { useProjectApprovals, useDecideProjectApproval } from '@/features/approval/hooks';
import { useAuthStore } from '@/store/auth-store';
import { ROUTES } from '@/lib/route-paths';
import { PageHead, StatusBadge, TypeBadge, Avatar2 } from '@/components/badges';
import { WorkListTableSkeleton } from '@/components/common/skeletons';
import { EmptyState } from '@/components/common/empty-state';
import { PageShell } from '@/components/common/page-shell';
import type { Approval, ApprovalState, WorkItemResponse } from '@/types/domain';

type Tab = 'pending' | 'mine' | 'all';
const TAB_LABEL: Record<Tab, string> = { pending: '승인 대기 중', mine: '내가 요청', all: '모든 승인' };
// 토글 → BE decision 필터(내가 요청은 전체 받아 클라에서 requestedBy 필터).
const TAB_DECISION: Record<Tab, ApprovalState | undefined> = { pending: 'PENDING', mine: undefined, all: undefined };

export function ApprovalsView() {
  const { key = '' } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: project, isPending: projectPending } = useProjectByKey(key);
  const projectId = project?.id;

  const [tab, setTab] = useState<Tab>('pending');
  const { data: approvals = [], isPending, isError } = useProjectApprovals(projectId, TAB_DECISION[tab]);
  const { data: members = [] } = useMembers(projectId);
  const { data: items = [] } = useProjectItems(projectId);
  const decide = useDecideProjectApproval(projectId!);

  const [rejecting, setRejecting] = useState<Approval | null>(null);

  const itemById = useMemo(() => {
    const m = new Map<number, WorkItemResponse>();
    items.forEach((i) => m.set(i.id, i));
    return m;
  }, [items]);
  const nameOf = (id?: number | null) => (id != null ? members.find((m) => m.userId === id)?.name : undefined);

  const rows = useMemo(() => {
    if (tab === 'mine' && user) return approvals.filter((a) => a.requestedBy === user.id);
    return approvals;
  }, [approvals, tab, user]);

  if (projectPending || (projectId && isPending)) return <WorkListTableSkeleton rows={6} />;

  if (isError) {
    return (
      <EmptyState
        icon={<AlertTriangle className="size-6" />}
        title="승인 목록을 불러오지 못했습니다"
        description="잠시 후 다시 시도해 주세요."
      />
    );
  }

  const header = (
    <>
      <PageHead
        title="승인"
        actions={
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate(ROUTES.admin.workflows)}>
            <Settings className="size-4" /> 승인 설정
          </Button>
        }
      />

      {/* 토글 */}
      <div className="mb-4 inline-flex rounded-md border border-border p-0.5">
        {(['pending', 'mine', 'all'] as Tab[]).map((t) => (
          <Button
            key={t}
            variant={tab === t ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setTab(t)}
          >
            {TAB_LABEL[t]}
          </Button>
        ))}
      </div>
    </>
  );

  return (
    <PageShell header={header}>
      {rows.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="size-6" />}
          title={tab === 'pending' ? '대기 중인 승인이 없습니다' : '승인 내역이 없습니다'}
          description="승인 게이트가 설정된 워크플로에서 항목이 게이트 상태에 도달하면 여기에 표시됩니다."
          action={
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate(ROUTES.admin.workflows)}>
              <Settings className="size-4" /> 승인 설정 열기
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">유형</TableHead>
              <TableHead>업무 항목</TableHead>
              <TableHead className="w-28">상태</TableHead>
              <TableHead className="w-28">담당자</TableHead>
              <TableHead className="w-28">승인자</TableHead>
              <TableHead className="w-24">결정</TableHead>
              <TableHead className="w-40 text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((a) => {
              const wi = itemById.get(a.workItemId);
              const isApprover = user != null && a.approverId === user.id;
              const canAct = a.decision === 'PENDING' && isApprover;
              return (
                <TableRow
                  key={a.id}
                  className="cursor-pointer"
                  onClick={() => wi && navigate(ROUTES.workItem(wi.key))}
                >
                  <TableCell>{wi ? <TypeBadge type={wi.issueType} withLabel={false} /> : '–'}</TableCell>
                  <TableCell className="max-w-0 truncate">
                    {wi ? (
                      <span className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-muted-foreground">{wi.key}</span>
                        <span className="truncate">{wi.title}</span>
                      </span>
                    ) : `#${a.workItemId}`}
                  </TableCell>
                  <TableCell>{wi ? <StatusBadge status={wi.commonStatus} /> : '–'}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5">
                      <Avatar2 name={nameOf(wi?.assigneeId)} />
                      <span className="truncate text-xs text-muted-foreground">{nameOf(wi?.assigneeId) ?? '미배정'}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {nameOf(a.approverId) ?? (a.approverRole ? `역할:${a.approverRole}` : '–')}
                  </TableCell>
                  <TableCell><DecisionBadge decision={a.decision} /></TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    {canAct ? (
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="primary" size="sm" disabled={decide.isPending}
                          onClick={() => decide.mutate({ approvalId: a.id, body: { decision: 'APPROVE' } })}
                        >
                          승인
                        </Button>
                        <Button
                          variant="destructive" size="sm" disabled={decide.isPending}
                          onClick={() => setRejecting(a)}
                        >
                          거부
                        </Button>
                      </div>
                    ) : a.decision === 'PENDING' ? (
                      <span className="text-xs text-muted-foreground">승인자만 처리</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{nameOf(a.decidedBy) ?? '처리됨'}</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <RejectDialog
        approval={rejecting}
        busy={decide.isPending}
        onCancel={() => setRejecting(null)}
        onConfirm={(comment) => {
          if (!rejecting) return;
          decide.mutate(
            { approvalId: rejecting.id, body: { decision: 'REJECT', comment: comment.trim() || undefined } },
            { onSettled: () => setRejecting(null) },
          );
        }}
      />
    </PageShell>
  );
}

function DecisionBadge({ decision }: { decision: ApprovalState }) {
  const style =
    decision === 'APPROVED' ? 'bg-green-100 text-green-700'
    : decision === 'REJECTED' ? 'bg-red-100 text-red-700'
    : 'bg-amber-100 text-amber-700';
  const label = decision === 'APPROVED' ? '승인됨' : decision === 'REJECTED' ? '거부됨' : '대기';
  return <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${style}`}>{label}</span>;
}

// 거부 사유 입력(선택) — 파괴적 액션이라 별도 확인. 사유는 선택(BE는 comment optional).
function RejectDialog({ approval, busy, onCancel, onConfirm }: {
  approval: Approval | null; busy: boolean; onCancel: () => void; onConfirm: (comment: string) => void;
}) {
  const [comment, setComment] = useState('');
  return (
    <Dialog open={!!approval} onOpenChange={(v) => !v && !busy && (onCancel(), setComment(''))}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>승인 거부</DialogTitle>
          <DialogDescription>거부 사유를 남길 수 있습니다(선택).</DialogDescription>
        </DialogHeader>
        <Textarea
          rows={3}
          placeholder="거부 사유(선택)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <DialogFooter>
          <Button variant="ghost" disabled={busy} onClick={() => { onCancel(); setComment(''); }}>취소</Button>
          <Button variant="destructive" disabled={busy} onClick={() => { onConfirm(comment); setComment(''); }}>
            {busy && <Spinner className="size-4" />} 거부
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
