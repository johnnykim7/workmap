// 필드 스킴 관리 (/admin/field-schemes, WMP-ADM-002) — OWNER/ADMIN. 유형/프로젝트별 필드 노출·필수.
// 필터: 프로젝트 ID + 업무 유형. 데이터=실 BE GET/POST/PUT/DELETE /admin/field-schemes.
import { useState } from 'react';
import {
  Button, Badge, Input,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@therecommerce/ds-ui';
import { Plus, Pencil, Trash2, ListChecks, AlertTriangle } from 'lucide-react';
import { PageHead, TypeOption } from '@/components/badges';
import { Pager } from '@/components/common/pager';
import { usePageParam } from '@/lib/use-page-param';
import { AdminTabs } from '@/features/admin/components/AdminTabs';
import { FieldSchemeDialog } from '@/features/admin/components/FieldSchemeDialog';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { WorkListTableSkeleton } from '@/components/common/skeletons';
import { useFieldSchemes, useFieldSchemeMutations } from '@/features/admin/hooks';
import { ISSUE_TYPE_LABEL, type IssueType } from '@/types/domain';
import type { FieldSchemeResponse, FieldSchemeRequest } from '@/features/admin/api';

const ALL = '__ALL__';
const ISSUE_TYPES = Object.keys(ISSUE_TYPE_LABEL) as IssueType[];

export function FieldSchemesPage() {
  const [page, setPage] = usePageParam();
  const [projectIdInput, setProjectIdInput] = useState('');
  const [issueTypeCode, setIssueTypeCode] = useState<string>(ALL);

  const projectId = projectIdInput.trim() ? Number(projectIdInput.trim()) : undefined;
  const { data, isPending, isError } = useFieldSchemes({
    projectId,
    issueTypeCode: issueTypeCode === ALL ? undefined : issueTypeCode,
    page,
  });
  const { create, update, remove } = useFieldSchemeMutations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FieldSchemeResponse | null>(null);
  const [deleting, setDeleting] = useState<FieldSchemeResponse | null>(null);

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(s: FieldSchemeResponse) { setEditing(s); setDialogOpen(true); }

  function submit(body: FieldSchemeRequest) {
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
        title="필드 스킴"
        desc="유형·프로젝트별 필드 노출/필수 정의 (POL-006)"
        actions={
          <Button variant="primary" size="sm" className="gap-1" onClick={openCreate}>
            <Plus className="size-4" /> 추가
          </Button>
        }
      />

      {/* 필터 바 */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          className="w-40"
          type="number"
          min={1}
          placeholder="프로젝트 ID(전역=비움)"
          value={projectIdInput}
          onChange={(e) => { setProjectIdInput(e.target.value); setPage(0); }}
        />
        <Select value={issueTypeCode} onValueChange={(v) => { setIssueTypeCode(v); setPage(0); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="모든 유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>모든 유형</SelectItem>
            {ISSUE_TYPES.map((t) => (
              <SelectItem key={t} value={t}><TypeOption type={t} /></SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <WorkListTableSkeleton rows={6} />
      ) : isError ? (
        <EmptyState
          icon={<AlertTriangle className="size-6" />}
          title="필드 스킴을 불러오지 못했습니다"
          description="잠시 후 다시 시도해 주세요."
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="size-6" />}
          title="필드 스킴이 없습니다"
          description="[추가]로 유형별 필드 노출·필수 규칙을 정의해 보세요."
        />
      ) : (
        <>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>범위</TableHead>
                  <TableHead>업무 유형</TableHead>
                  <TableHead>필드 키</TableHead>
                  <TableHead className="w-20 text-center">노출</TableHead>
                  <TableHead className="w-20 text-center">필수</TableHead>
                  <TableHead className="w-20 text-center">정렬</TableHead>
                  <TableHead className="w-28 text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-muted-foreground">
                      {s.projectId != null ? `프로젝트 #${s.projectId}` : '전역 기본'}
                    </TableCell>
                    <TableCell>{ISSUE_TYPE_LABEL[s.issueTypeCode as IssueType] ?? s.issueTypeCode}</TableCell>
                    <TableCell className="font-medium">{s.fieldKey}</TableCell>
                    <TableCell className="text-center">
                      {s.isVisible ? <Badge variant="success">노출</Badge> : <Badge variant="secondary">숨김</Badge>}
                    </TableCell>
                    <TableCell className="text-center">
                      {s.isRequired ? <Badge variant="warning">필수</Badge> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">{s.sortOrder}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button variant="secondary" size="sm" className="gap-1" onClick={() => openEdit(s)}>
                          <Pencil className="size-3.5" /> 수정
                        </Button>
                        <Button variant="destructive" size="sm" className="gap-1" onClick={() => setDeleting(s)}>
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

      <FieldSchemeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        busy={create.isPending || update.isPending}
        onSubmit={submit}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="필드 스킴 삭제"
        description={deleting ? `'${deleting.fieldKey}' 필드 스킴을 삭제합니다. 되돌릴 수 없습니다.` : ''}
        confirmLabel="삭제"
        busy={remove.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
