// 양식 빌더 (/admin/forms, WMP-ADM-005) — OWNER/ADMIN. 양식 CRUD + 제출 테스트.
// 양식 = 제출 시 work_item 생성(project/issueType 고정 + fields JSONB). 데이터=실 BE /admin/forms.
import { useState } from 'react';
import {
  Button, Badge, Input,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@therecommerce/ds-ui';
import { Plus, Pencil, Trash2, Send, FileText, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHead } from '@/components/badges';
import { AdminTabs } from '@/features/admin/components/AdminTabs';
import { FormDialog } from '@/features/admin/components/FormDialog';
import { FormSubmitDialog } from '@/features/admin/components/FormSubmitDialog';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { WorkListTableSkeleton } from '@/components/common/skeletons';
import { useForms, useFormMutations } from '@/features/admin/hooks';
import { ISSUE_TYPE_LABEL, type IssueType } from '@/types/domain';
import type { FormResponse, FormRequest } from '@/features/admin/api';

export function FormsPage() {
  const [page, setPage] = useState(0);
  const [projectIdInput, setProjectIdInput] = useState('');
  const projectId = projectIdInput.trim() ? Number(projectIdInput.trim()) : undefined;

  const { data, isPending, isError } = useForms(projectId, page);
  const { create, update, remove, submit } = useFormMutations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FormResponse | null>(null);
  const [deleting, setDeleting] = useState<FormResponse | null>(null);
  const [submitting, setSubmitting] = useState<FormResponse | null>(null);

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(f: FormResponse) { setEditing(f); setDialogOpen(true); }

  function submitForm(body: FormRequest) {
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
        title="양식 빌더"
        desc="양식 CRUD — 제출 시 업무 생성 (WMP-ADM-005)"
        actions={
          <Button variant="primary" size="sm" className="gap-1" onClick={openCreate}>
            <Plus className="size-4" /> 양식 추가
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <Input
          className="w-48"
          type="number"
          min={1}
          placeholder="프로젝트 ID로 필터(비움=전체)"
          value={projectIdInput}
          onChange={(e) => { setProjectIdInput(e.target.value); setPage(0); }}
        />
      </div>

      {isPending ? (
        <WorkListTableSkeleton rows={6} />
      ) : isError ? (
        <EmptyState
          icon={<AlertTriangle className="size-6" />}
          title="양식을 불러오지 못했습니다"
          description="잠시 후 다시 시도해 주세요."
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-6" />}
          title="등록된 양식이 없습니다"
          description="[양식 추가]로 첫 양식을 만들어 보세요."
        />
      ) : (
        <>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>프로젝트</TableHead>
                  <TableHead>생성 유형</TableHead>
                  <TableHead className="w-20 text-center">공개</TableHead>
                  <TableHead className="w-44 text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell className="text-muted-foreground">#{f.projectId}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {ISSUE_TYPE_LABEL[f.issueTypeCode as IssueType] ?? f.issueTypeCode}
                    </TableCell>
                    <TableCell className="text-center">
                      {f.isPublic ? <Badge variant="success">공개</Badge> : <Badge variant="secondary">비공개</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button variant="ghost" size="sm" className="gap-1" onClick={() => setSubmitting(f)}>
                          <Send className="size-3.5" /> 제출
                        </Button>
                        <Button variant="secondary" size="sm" className="gap-1" onClick={() => openEdit(f)}>
                          <Pencil className="size-3.5" /> 수정
                        </Button>
                        <Button variant="destructive" size="sm" className="gap-1" onClick={() => setDeleting(f)}>
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

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        busy={create.isPending || update.isPending}
        onSubmit={submitForm}
      />

      <FormSubmitDialog
        open={!!submitting}
        onOpenChange={(o) => !o && setSubmitting(null)}
        form={submitting}
        busy={submit.isPending}
        onSubmit={(body) => {
          if (!submitting) return;
          submit.mutate({ id: submitting.id, body }, { onSuccess: () => setSubmitting(null) });
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="양식 삭제"
        description={deleting ? `'${deleting.name}' 양식을 삭제합니다. 되돌릴 수 없습니다.` : ''}
        confirmLabel="삭제"
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}
