// 사용자 관리 (/admin/users, WMP-AUTH-004/005) — OWNER/ADMIN. 검색·생성·수정·비활성화.
// 데이터=실 BE GET /users(검색) · POST/PATCH /users · PATCH /users/{id}/deactivate.
import { useState } from 'react';
import {
  Button, Badge, SearchInput,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@therecommerce/ds-ui';
import { Plus, Pencil, UserX, Users, AlertTriangle, ChevronLeft, ChevronRight, Mail, Send, X } from 'lucide-react';
import { PageHead } from '@/components/badges';
import { AdminTabs } from '@/features/admin/components/AdminTabs';
import { UserDialog, ROLE_LABEL } from '@/features/user/components/UserDialog';
import { InviteDialog } from '@/features/invitation/components/InviteDialog';
import { SignupRequestsSection } from '@/features/invitation/components/SignupRequestsSection';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { WorkListTableSkeleton } from '@/components/common/skeletons';
import { useUsers, useUserMutations } from '@/features/user/hooks';
import { useInvitations, useInvitationMutations } from '@/features/invitation/hooks';
import type { User, UserRole } from '@/types/domain';
import type { InvitationResponse } from '@/features/invitation/api';

export function UsersPage() {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const { data, isPending, isError, isPlaceholderData } = useUsers(keyword, page);
  const { create, update, deactivate } = useUserMutations();

  // CR-027 — 초대(PENDING 목록 + 초대/재발송/취소)
  const { data: pendingInvites } = useInvitations('PENDING');
  const { invite, resend, revoke } = useInvitationMutations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deactivating, setDeactivating] = useState<User | null>(null);
  const [revoking, setRevoking] = useState<InvitationResponse | null>(null);

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(u: User) { setEditing(u); setDialogOpen(true); }

  return (
    <div>
      <AdminTabs />
      <PageHead
        title="사용자"
        desc="초대·생성·수정·비활성화 (POL-004)"
        actions={
          <div className="flex gap-2">
            <Button variant="primary" size="sm" className="gap-1" onClick={() => setInviteOpen(true)}>
              <Mail className="size-4" /> 사용자 초대
            </Button>
            <Button variant="secondary" size="sm" className="gap-1" onClick={openCreate}>
              <Plus className="size-4" /> 직접 생성
            </Button>
          </div>
        }
      />

      {/* CR-032 — 대기 중인 가입 요청(승인=역할지정 후 초대발송·거절). */}
      <SignupRequestsSection />

      {/* CR-027 — 대기 중인 초대(PENDING). 재발송/취소. */}
      {pendingInvites && pendingInvites.length > 0 && (
        <div className="mb-5 rounded-lg border border-border bg-muted/20 p-3">
          <div className="mb-2 text-sm font-medium text-foreground">대기 중인 초대 ({pendingInvites.length})</div>
          <div className="flex flex-col gap-1.5">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-md bg-background px-3 py-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-3.5" />
                  <span className="font-medium text-foreground">{inv.email}</span>
                  <span>· {inv.name}</span>
                  <Badge variant="secondary">{ROLE_LABEL[inv.role as UserRole] ?? inv.role}</Badge>
                </div>
                <div className="inline-flex gap-1">
                  <Button
                    variant="ghost" size="sm" className="gap-1"
                    disabled={resend.isPending} onClick={() => resend.mutate(inv.id)}
                  >
                    <Send className="size-3.5" /> 재발송
                  </Button>
                  <Button
                    variant="ghost" size="sm" className="gap-1 text-destructive"
                    disabled={revoke.isPending} onClick={() => setRevoking(inv)}
                  >
                    <X className="size-3.5" /> 취소
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <SearchInput
          className="w-72"
          placeholder="이름·이메일 검색"
          value={keyword}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setKeyword(e.target.value); setPage(0); }}
        />
      </div>

      {isPending ? (
        <WorkListTableSkeleton rows={6} />
      ) : isError ? (
        <EmptyState
          icon={<AlertTriangle className="size-6" />}
          title="사용자를 불러오지 못했습니다"
          description="권한(OWNER/ADMIN)이 있는지 확인하거나 잠시 후 다시 시도해 주세요."
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Users className="size-6" />}
          title="사용자가 없습니다"
          description="[사용자 생성]으로 새 사용자를 추가해 보세요."
        />
      ) : (
        <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : ''}>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead className="w-28">역할</TableHead>
                  <TableHead className="w-20 text-center">상태</TableHead>
                  <TableHead className="w-32 text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>{ROLE_LABEL[u.role as UserRole] ?? u.role}</TableCell>
                    <TableCell className="text-center">
                      {u.active ? <Badge variant="success">활성</Badge> : <Badge variant="secondary">비활성</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button variant="secondary" size="sm" className="gap-1" onClick={() => openEdit(u)}>
                          <Pencil className="size-3.5" /> 수정
                        </Button>
                        <Button
                          variant="destructive" size="sm" className="gap-1"
                          disabled={!u.active} onClick={() => setDeactivating(u)}
                        >
                          <UserX className="size-3.5" /> 비활성화
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-center gap-3">
              <Button variant="ghost" size="sm" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="size-4" /> 이전
              </Button>
              <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
              <Button variant="ghost" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                다음 <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        busy={create.isPending || update.isPending}
        onCreate={(body) => create.mutate(body, { onSuccess: () => setDialogOpen(false) })}
        onUpdate={(id, body) => update.mutate({ id, body }, { onSuccess: () => setDialogOpen(false) })}
      />

      <ConfirmDialog
        open={!!deactivating}
        onOpenChange={(o) => !o && setDeactivating(null)}
        title="사용자 비활성화"
        description={deactivating ? `'${deactivating.name}'(${deactivating.email})을(를) 비활성화합니다.` : ''}
        confirmLabel="비활성화"
        busy={deactivate.isPending}
        onConfirm={() => deactivating && deactivate.mutate(deactivating.id, { onSuccess: () => setDeactivating(null) })}
      />

      {/* CR-027 — 사용자 초대 */}
      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        busy={invite.isPending}
        onInvite={(body) => invite.mutate(body, { onSuccess: () => setInviteOpen(false) })}
      />

      <ConfirmDialog
        open={!!revoking}
        onOpenChange={(o) => !o && setRevoking(null)}
        title="초대 취소"
        description={revoking ? `'${revoking.email}' 초대를 취소합니다. 받은 인증번호는 무효화됩니다.` : ''}
        confirmLabel="초대 취소"
        busy={revoke.isPending}
        onConfirm={() => revoking && revoke.mutate(revoking.id, { onSuccess: () => setRevoking(null) })}
      />
    </div>
  );
}
