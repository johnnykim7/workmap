// 멤버 패널 — 목록 + 초대 + 제거. 프로젝트 요약(SummaryView)에서 사용. 경로는 numeric projectId.
import { useState } from 'react';
import { UserPlus, Trash2, Users } from 'lucide-react';
import { Button } from '@therecommerce/ds-ui';
import { UserAvatar } from '@/components/common/user-avatar';
import { EmptyState } from '@/components/common/empty-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { MemberRowsSkeleton } from '@/components/common/skeletons';
import { InviteMemberDialog } from './InviteMemberDialog';
import { useMembers, useRemoveMember } from '../hooks';
import { useAuthStore } from '@/store/auth-store';
import type { ProjectMember, UserRole } from '@/types/domain';

const MEMBER_ROLE_LABEL: Record<UserRole, string> = {
  OWNER: '오너', ADMIN: '관리자', MANAGER: '매니저', MEMBER: '멤버', VIEWER: '뷰어',
};

export function MembersPanel({ projectId }: { projectId?: number }) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<ProjectMember | null>(null);

  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === 'OWNER' || role === 'ADMIN' || role === 'MANAGER';

  const { data: members, isPending } = useMembers(projectId);
  const remove = useRemoveMember(projectId);

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Users className="size-4" /> 멤버 {members ? `(${members.length})` : ''}
        </h2>
        {canManage && (
          <Button variant="primary" size="sm" onClick={() => setInviteOpen(true)} disabled={!projectId}>
            <UserPlus className="size-4" /> 초대
          </Button>
        )}
      </div>

      {isPending || !projectId ? (
        <MemberRowsSkeleton />
      ) : !members || members.length === 0 ? (
        <EmptyState icon={<Users className="size-6" />} title="멤버가 없습니다" description="멤버를 초대해 협업을 시작하세요." />
      ) : (
        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center gap-3 rounded-md border border-border p-3">
              <UserAvatar userId={m.userId} name={m.name} avatarUrl={m.avatarUrl} size="md" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{m.name}</div>
                <div className="truncate text-xs text-muted-foreground">{m.email}</div>
              </div>
              <span className="rounded bg-muted px-2 py-0.5 text-xs text-foreground">{MEMBER_ROLE_LABEL[m.role]}</span>
              {canManage && (
                <Button variant="ghost" size="sm" onClick={() => setRemoveTarget(m)} aria-label={`${m.name} 제거`}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        projectId={projectId}
        excludeUserIds={members?.map((m) => m.userId) ?? []}
      />

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(v) => !v && setRemoveTarget(null)}
        title="멤버를 제거할까요?"
        description={removeTarget ? `${removeTarget.name}님을 프로젝트에서 제거합니다.` : undefined}
        confirmLabel="제거"
        busy={remove.isPending}
        onConfirm={() => {
          if (!removeTarget) return;
          remove.mutate(removeTarget.userId, { onSuccess: () => setRemoveTarget(null) });
        }}
      />
    </div>
  );
}
