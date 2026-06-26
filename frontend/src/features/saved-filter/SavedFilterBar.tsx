// 저장 필터 바 (WMP-VIEW-004) — 검색 화면 상단. 저장된 필터 칩(적용) + 현재 조건 저장 + 삭제(소유자).
// query JSON 구조는 SearchPage의 savable 상태와 일치(serializeFilter/parseFilter로 변환).
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button, Badge, Spinner, Input, Switch,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@therecommerce/ds-ui';
import { BookmarkPlus, X, Bookmark } from 'lucide-react';
import { Field } from '@/components/common/field';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useSavedFilters, useSavedFilterMutations } from './hooks';
import type { SavedFilterResponse } from './api';
import type { SearchFilterState } from './filter-codec';

interface Props {
  /** 현재 검색 조건(저장 대상). */
  current: SearchFilterState;
  /** 저장 필터 적용 콜백. */
  onApply: (state: SearchFilterState) => void;
}

export function SavedFilterBar({ current, onApply }: Props) {
  const { data: filters = [], isPending } = useSavedFilters();
  const { create, remove } = useSavedFilterMutations();
  const [saveOpen, setSaveOpen] = useState(false);
  const [deleting, setDeleting] = useState<SavedFilterResponse | null>(null);

  function applyFilter(f: SavedFilterResponse) {
    try {
      onApply(JSON.parse(f.query) as SearchFilterState);
    } catch {
      // 잘못된 query JSON은 무시(서버가 임의 문자열 패스스루이므로 방어).
    }
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Bookmark className="size-3.5" /> 저장 필터
      </span>

      {isPending ? (
        <span className="text-xs text-muted-foreground">불러오는 중…</span>
      ) : filters.length === 0 ? (
        <span className="text-xs text-muted-foreground">저장된 필터 없음</span>
      ) : (
        filters.map((f) => (
          <span
            key={f.id}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 py-0.5 pl-2.5 pr-1 text-xs"
          >
            <button type="button" className="font-medium hover:underline" onClick={() => applyFilter(f)}>
              {f.name}
            </button>
            {f.shared && !f.mine && <Badge variant="secondary">공유</Badge>}
            {f.mine && (
              <button
                type="button"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setDeleting(f)}
                aria-label="필터 삭제"
              >
                <X className="size-3.5" />
              </button>
            )}
          </span>
        ))
      )}

      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setSaveOpen(true)}>
        <BookmarkPlus className="size-3.5" /> 현재 조건 저장
      </Button>

      <SaveFilterDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        busy={create.isPending}
        onSave={(name, shared) =>
          create.mutate(
            { name, query: JSON.stringify(current), shared },
            { onSuccess: () => setSaveOpen(false) },
          )
        }
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="저장 필터 삭제"
        description={deleting ? `'${deleting.name}' 필터를 삭제합니다.` : ''}
        confirmLabel="삭제"
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}

const schema = z.object({
  name: z.string().trim().min(1, '이름을 입력하세요.').max(60),
  shared: z.boolean(),
});
type SaveValues = z.infer<typeof schema>;

function SaveFilterDialog({ open, onOpenChange, busy, onSave }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  busy: boolean;
  onSave: (name: string, shared: boolean) => void;
}) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<SaveValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', shared: false },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) { onOpenChange(o); if (!o) reset(); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>현재 검색 조건 저장</DialogTitle>
          <DialogDescription>지금의 검색어·필터·퀵필터를 이름 붙여 저장합니다.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => onSave(v.name.trim(), v.shared))} className="space-y-3">
          <Field label="이름" required error={errors.name?.message}>
            <Input placeholder="예: 내 막힌 버그" {...register('name')} />
          </Field>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <span className="text-sm text-foreground">공유(shared) — 다른 사용자도 사용</span>
            <Switch checked={watch('shared')} onCheckedChange={(v) => setValue('shared', v)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy && <Spinner className="size-4" />}
              저장
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
