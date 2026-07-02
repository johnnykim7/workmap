// 대기 가입 요청 섹션 (WMP-AUTH-010, CR-032) — 관리자 사용자 화면에 삽입.
// PENDING 신청 목록 + 역할 지정 승인(→초대 발송)·거절. ds-ui만.
import { useState } from 'react';
import {
  Button, Badge,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@therecommerce/ds-ui';
import { UserPlus, Check, X } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { ROLE_LABEL } from '@/features/user/components/UserDialog';
import { useSignupRequests, useSignupRequestMutations } from '../signup-hooks';
import type { SignupRequestResponse } from '../signup-api';
import type { UserRole } from '@/types/domain';

const ROLES = Object.keys(ROLE_LABEL) as UserRole[];

export function SignupRequestsSection() {
  const { data: requests } = useSignupRequests('PENDING');
  const { approve, reject } = useSignupRequestMutations();
  const [roleById, setRoleById] = useState<Record<number, string>>({});
  const [rejecting, setRejecting] = useState<SignupRequestResponse | null>(null);

  if (!requests || requests.length === 0) return null;

  return (
    <div className="mb-5 rounded-lg border border-border bg-muted/20 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
        <UserPlus className="size-4" /> 대기 중인 가입 요청 ({requests.length})
      </div>
      <div className="flex flex-col gap-1.5">
        {requests.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-2 rounded-md bg-background px-3 py-2 text-sm">
            <div className="min-w-0 flex-1">
              <span className="font-medium text-foreground">{r.email}</span>
              <span className="text-muted-foreground"> · {r.name}</span>
              {r.reason && <div className="truncate text-xs text-muted-foreground">사유: {r.reason}</div>}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Select value={roleById[r.id] ?? 'MEMBER'} onValueChange={(v) => setRoleById((m) => ({ ...m, [r.id]: v }))}>
                <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => <SelectItem key={role} value={role}>{ROLE_LABEL[role]}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button
                variant="primary" size="sm" className="gap-1"
                disabled={approve.isPending}
                onClick={() => approve.mutate({ id: r.id, role: roleById[r.id] ?? 'MEMBER' })}
              >
                <Check className="size-3.5" /> 승인
              </Button>
              <Button
                variant="ghost" size="sm" className="gap-1 text-destructive"
                disabled={reject.isPending} onClick={() => setRejecting(r)}
              >
                <X className="size-3.5" /> 거절
              </Button>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        승인 시 지정한 역할로 <Badge variant="secondary">초대 메일</Badge>이 발송됩니다.
      </p>

      <ConfirmDialog
        open={!!rejecting}
        onOpenChange={(o) => !o && setRejecting(null)}
        title="가입 요청 거절"
        description={rejecting ? `'${rejecting.email}'의 가입 요청을 거절합니다.` : ''}
        confirmLabel="거절"
        busy={reject.isPending}
        onConfirm={() => rejecting && reject.mutate({ id: rejecting.id }, { onSuccess: () => setRejecting(null) })}
      />
    </div>
  );
}
