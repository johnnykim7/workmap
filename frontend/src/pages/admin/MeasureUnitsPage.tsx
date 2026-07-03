// 측정 단위 관리 (/admin/measure-units, WMP-ADM-001) — OWNER/ADMIN. CRUD 표 + 추가/수정 모달 + 삭제 확인.
// 시스템 단위(isSystem)는 수정·삭제 불가(POL-005). 데이터=실 BE GET/POST/PUT/DELETE /admin/measure-units.
import { useState } from 'react';
import {
  Button, Badge,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@therecommerce/ds-ui';
import { Plus, Pencil, Trash2, Ruler, AlertTriangle } from 'lucide-react';
import { PageHead } from '@/components/badges';
import { Pager } from '@/components/common/pager';
import { usePageParam } from '@/lib/use-page-param';
import { AdminTabs } from '@/features/admin/components/AdminTabs';
import { MeasureUnitDialog } from '@/features/admin/components/MeasureUnitDialog';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { WorkListTableSkeleton } from '@/components/common/skeletons';
import { useMeasureUnits, useMeasureUnitMutations } from '@/features/admin/hooks';
import type { MeasureUnitResponse, MeasureUnitRequest } from '@/features/admin/api';

const VALUE_TYPE_LABEL: Record<string, string> = {
  NUMBER: '숫자',
  BOOLEAN: '예/아니오',
  SELECT: '선택지',
};

export function MeasureUnitsPage() {
  const [page, setPage] = usePageParam();
  const { data, isPending, isError } = useMeasureUnits(page);
  const { create, update, remove } = useMeasureUnitMutations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MeasureUnitResponse | null>(null);
  const [deleting, setDeleting] = useState<MeasureUnitResponse | null>(null);

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(u: MeasureUnitResponse) { setEditing(u); setDialogOpen(true); }

  function submit(body: MeasureUnitRequest) {
    if (editing) {
      update.mutate({ id: editing.id, body }, { onSuccess: () => setDialogOpen(false) });
    } else {
      create.mutate(body, { onSuccess: () => setDialogOpen(false) });
    }
  }

  function confirmDelete() {
    if (!deleting) return;
    remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
  }

  return (
    <div>
      <AdminTabs />
      <PageHead
        title="측정 단위"
        desc="측정값의 이름·유형·단위 정의 (POL-005)"
        actions={
          <Button variant="primary" size="sm" className="gap-1" onClick={openCreate}>
            <Plus className="size-4" /> 추가
          </Button>
        }
      />

      {isPending ? (
        <WorkListTableSkeleton rows={6} />
      ) : isError ? (
        <EmptyState
          icon={<AlertTriangle className="size-6" />}
          title="측정 단위를 불러오지 못했습니다"
          description="잠시 후 다시 시도해 주세요."
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Ruler className="size-6" />}
          title="등록된 측정 단위가 없습니다"
          description="[추가]로 첫 측정 단위를 정의해 보세요."
        />
      ) : (
        <>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>값 유형</TableHead>
                  <TableHead>단위/옵션</TableHead>
                  <TableHead className="w-20 text-center">정렬</TableHead>
                  <TableHead className="w-28 text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.name}
                      {u.isSystem && <Badge variant="secondary" className="ml-2">시스템</Badge>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {VALUE_TYPE_LABEL[u.valueType] ?? u.valueType}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.valueType === 'SELECT'
                        ? (u.options ?? []).join(', ')
                        : u.suffix || '—'}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">{u.sortOrder}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          variant="secondary" size="sm" className="gap-1"
                          disabled={u.isSystem} onClick={() => openEdit(u)}
                        >
                          <Pencil className="size-3.5" /> 수정
                        </Button>
                        <Button
                          variant="destructive" size="sm" className="gap-1"
                          disabled={u.isSystem} onClick={() => setDeleting(u)}
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

          <Pager page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      <MeasureUnitDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        busy={create.isPending || update.isPending}
        onSubmit={submit}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="측정 단위 삭제"
        description={deleting ? `'${deleting.name}' 측정 단위를 삭제합니다. 되돌릴 수 없습니다.` : ''}
        confirmLabel="삭제"
        busy={remove.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
