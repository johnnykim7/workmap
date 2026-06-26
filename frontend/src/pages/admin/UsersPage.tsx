// 사용자 관리 (/admin/users, WMP-AUTH-004/005) — OWNER/ADMIN. 검색·생성·수정·비활성화.
// 데이터=실 BE GET /users(검색) · POST/PATCH /users · PATCH /users/{id}/deactivate.
import { useState } from 'react';
import {
  Button, Badge, SearchInput,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@therecommerce/ds-ui';
import { Plus, Pencil, UserX, Users, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHead } from '@/components/badges';
import { AdminTabs } from '@/features/admin/components/AdminTabs';
import { UserDialog, ROLE_LABEL } from '@/features/user/components/UserDialog';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { WorkListTableSkeleton } from '@/components/common/skeletons';
import { useUsers, useUserMutations } from '@/features/user/hooks';
import type { User, UserRole } from '@/types/domain';

export function UsersPage() {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const { data, isPending, isError, isPlaceholderData } = useUsers(keyword, page);
  const { create, update, deactivate } = useUserMutations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deactivating, setDeactivating] = useState<User | null>(null);

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(u: User) { setEditing(u); setDialogOpen(true); }

  return (
    <div>
      <AdminTabs />
      <PageHead
        title="사용자"
        desc="사용자 생성·수정·비활성화 (POL-004)"
        actions={
          <Button variant="primary" size="sm" className="gap-1" onClick={openCreate}>
            <Plus className="size-4" /> 사용자 생성
          </Button>
        }
      />

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
    </div>
  );
}
