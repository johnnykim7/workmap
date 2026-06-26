// 승인 대기 영역(§9.3) — 항목이 승인 게이트(PENDING)일 때 본문 상단 배너.
// 지정 승인자(approverId == 현재 유저)에게만 승인/거부 + 코멘트 노출, 그 외 읽기 전용.
// 처리: POST /approvals/{id}/decision. Phase1은 결정만 기록(상태 전이는 워크플로/상단 상태 Select 경유).
import { useState } from 'react';
import { Button, Textarea, Spinner } from '@therecommerce/ds-ui';
import { ShieldAlert } from 'lucide-react';
import { fmtDateTime } from '@/lib/date';
import { useMembers } from '@/features/members/hooks';
import { useAuthStore } from '@/store/auth-store';
import { type WorkItemResponse, type Approval } from '@/types/domain';
import { useApprovals, useDecideApproval } from '../hooks';

export function ApprovalBanner({ item }: { item: WorkItemResponse }) {
  const { data: approvals = [] } = useApprovals(item.id);
  const pending = approvals.filter((a) => a.decision === 'PENDING'); // BE: decision NOT NULL, 미결정='PENDING'
  if (pending.length === 0) return null;

  return (
    <div className="space-y-2">
      {pending.map((a) => <PendingCard key={a.id} item={item} approval={a} />)}
    </div>
  );
}

function PendingCard({ item, approval }: { item: WorkItemResponse; approval: Approval }) {
  const { data: members = [] } = useMembers(item.projectId);
  const user = useAuthStore((s) => s.user);
  const decide = useDecideApproval(item.id, item.key);
  const [comment, setComment] = useState('');

  const nameOf = (id?: number | null) => (id != null ? members.find((m) => m.userId === id)?.name : undefined) ?? `#${id}`;
  const isApprover = user != null && approval.approverId === user.id;

  function act(decision: 'APPROVE' | 'REJECT') {
    decide.mutate(
      { approvalId: approval.id, body: { decision, comment: comment.trim() || undefined } },
      { onSuccess: () => setComment('') },
    );
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
      <div className="flex items-start gap-2">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-900">승인 대기 중</p>
          <p className="mt-0.5 text-xs text-amber-800">
            요청자 {nameOf(approval.requestedBy)} · {fmtDateTime(approval.createdAt)}
            {approval.approverRole && <> · 승인자 역할 {approval.approverRole}</>}
          </p>

          {isApprover ? (
            <div className="mt-2 space-y-2">
              <Textarea
                rows={2}
                placeholder="코멘트(선택)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="bg-white"
              />
              <div className="flex gap-2">
                <Button variant="primary" size="sm" disabled={decide.isPending} onClick={() => act('APPROVE')}>
                  {decide.isPending && <Spinner className="size-4" />} 승인
                </Button>
                <Button variant="destructive" size="sm" disabled={decide.isPending} onClick={() => act('REJECT')}>
                  거부
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-xs text-amber-700">지정 승인자만 처리할 수 있습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
