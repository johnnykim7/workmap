// 업무 유형 마스터 (/admin/issue-types, WMP-ADM-004) — OWNER/ADMIN. 유형 카탈로그 CRUD.
// 시스템 5종(isSystem)은 수정/삭제 불가. 데이터=실 BE GET/POST/PUT/DELETE /admin/issue-types.
import { useState } from 'react';
import {
  Button, Badge,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@therecommerce/ds-ui';
import { Plus, Pencil, Trash2, Shapes, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHead } from '@/components/badges';
import { AdminTabs } from '@/features/admin/components/AdminTabs';
import { IssueTypeDialog } from '@/features/admin/components/IssueTypeDialog';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { WorkListTableSkeleton } from '@/components/common/skeletons';
import { useIssueTypes, useIssueTypeMutations } from '@/features/admin/hooks';
import type { IssueTypeMasterResponse, IssueTypeMasterRequest } from '@/features/admin/api';

export function IssueTypesPage() {
  const [page, setPage] = useState(0);
  const { data, isPending, isError } = useIssueTypes(page);
  const { create, update, remove } = useIssueTypeMutations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<IssueTypeMasterResponse | null>(null);
  const [deleting, setDeleting] = useState<IssueTypeMasterResponse | null>(null);

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(t: IssueTypeMasterResponse) { setEditing(t); setDialogOpen(true); }

  function submit(body: IssueTypeMasterRequest) {
    if (editing) {
      update.mutate({ id: editing.id, body }, { onSuccess: () => setDialogOpen(false) });
    } else {
      create.mutate(body, { onSuccess: () => setDialogOpen(false) });
    }
  }

  return (
    <div>
      <AdminTabs />
      <PageHead
        title="업무 유형"
        desc="업무 유형 카탈로그 — 계층·색·아이콘 (WMP-ADM-004)"
        actions={
          <Button variant="primary" size="sm" className="gap-1" onClick={openCreate}>
            <Plus className="size-4" /> 유형 추가
          </Button>
        }
      />

      {isPending ? (
        <WorkListTableSkeleton rows={6} />
      ) : isError ? (
        <EmptyState
          icon={<AlertTriangle className="size-6" />}
          title="업무 유형을 불러오지 못했습니다"
          description="잠시 후 다시 시도해 주세요."
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Shapes className="size-6" />}
          title="등록된 업무 유형이 없습니다"
          description="[유형 추가]로 첫 유형을 정의해 보세요."
        />
      ) : (
        <>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>코드</TableHead>
                  <TableHead>라벨</TableHead>
                  <TableHead className="w-20 text-center">계층</TableHead>
                  <TableHead>색/아이콘</TableHead>
                  <TableHead className="w-20 text-center">정렬</TableHead>
                  <TableHead className="w-28 text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {t.code}
                      {t.isSystem && <Badge variant="secondary" className="ml-2">시스템</Badge>}
                    </TableCell>
                    <TableCell className="font-medium">{t.label}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{t.depth}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {[t.color, t.icon].filter(Boolean).join(' / ') || '—'}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">{t.sortOrder}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          variant="secondary" size="sm" className="gap-1"
                          disabled={t.isSystem} onClick={() => openEdit(t)}
                        >
                          <Pencil className="size-3.5" /> 수정
                        </Button>
                        <Button
                          variant="destructive" size="sm" className="gap-1"
                          disabled={t.isSystem} onClick={() => setDeleting(t)}
                        >
                          <Trash2 className="size-3.5" /> 삭제
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
        </>
      )}

      <IssueTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        busy={create.isPending || update.isPending}
        onSubmit={submit}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="업무 유형 삭제"
        description={deleting ? `'${deleting.label}' (${deleting.code}) 유형을 삭제합니다. 되돌릴 수 없습니다.` : ''}
        confirmLabel="삭제"
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}
