// 연결된 업무 항목(계층 무관 링크) — §9.3. 하위작업과 별개 섹션.
// blocks / blocked by / relates to / duplicates. 추가=유형 선택 + 프로젝트 내 항목 검색. 삭제=확인.
import { useEffect, useMemo, useState, type MutableRefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Spinner, SearchInput,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@therecommerce/ds-ui';
import { Plus, X, Link2 } from 'lucide-react';
import { ROUTES } from '@/lib/route-paths';
import { StatusBadge, TypeBadge } from '@/components/badges';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  type WorkItemResponse, type LinkType, type LinkView, LINK_TYPE_LABEL,
} from '@/types/domain';
import { useLinks, useCreateLink, useDeleteLink, useProjectItems } from '../hooks';
import { SECTION_LABEL_CLS } from './DetailBody';

const LINK_TYPES: LinkType[] = ['BLOCKS', 'BLOCKED_BY', 'RELATES_TO', 'DUPLICATES'];

export function LinkedItems({ item, addRef }: { item: WorkItemResponse; addRef?: MutableRefObject<() => void> }) {
  const navigate = useNavigate();
  const { data: links = [], isPending } = useLinks(item.id);
  const [addOpen, setAddOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<LinkView | null>(null);
  const deleteLink = useDeleteLink(item.id);

  useEffect(() => { if (addRef) addRef.current = () => setAddOpen(true); }, [addRef]);

  // 링크 유형별 그룹핑
  const grouped = useMemo(() => {
    const g: Record<LinkType, LinkView[]> = { BLOCKS: [], BLOCKED_BY: [], RELATES_TO: [], DUPLICATES: [] };
    links.forEach((l) => g[l.linkType]?.push(l));
    return g;
  }, [links]);

  return (
    <section>
      <div className="mb-1.5 flex items-center justify-between">
        <h2 className={SECTION_LABEL_CLS}>연결된 업무</h2>
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" /> 연결
        </Button>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : links.length === 0 ? (
        // 빈 섹션 압축: 안내문 줄 제거(제목+연결 버튼만).
        null
      ) : (
        <div className="space-y-3">
          {LINK_TYPES.filter((t) => grouped[t].length > 0).map((t) => (
            <div key={t}>
              <div className="mb-1 text-xs font-medium text-muted-foreground">{LINK_TYPE_LABEL[t]}</div>
              <ul className="divide-y divide-border rounded-md border border-border">
                {grouped[t].map((l) => (
                  <li key={l.linkId} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <button
                      type="button"
                      onClick={() => navigate(ROUTES.workItem(l.targetKey))}
                      className="flex flex-1 items-center gap-2 text-left hover:underline"
                    >
                      <TypeBadge type={l.targetIssueType} withLabel={false} />
                      <span className="font-mono text-xs text-muted-foreground">{l.targetKey}</span>
                      <span className="flex-1 truncate">{l.targetTitle}</span>
                      <StatusBadge status={l.targetCommonStatus} />
                    </button>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setPendingDelete(l)}
                      aria-label="연결 해제"
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <AddLinkDialog item={item} open={addOpen} onOpenChange={setAddOpen} existingTargetIds={links.map((l) => l.targetId)} />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(v) => !v && setPendingDelete(null)}
        title="연결 해제"
        description={pendingDelete ? `"${pendingDelete.targetKey} ${pendingDelete.targetTitle}" 연결을 해제합니다.` : ''}
        confirmLabel="해제"
        busy={deleteLink.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteLink.mutate(pendingDelete.linkId, { onSettled: () => setPendingDelete(null) });
        }}
      />
    </section>
  );
}

function AddLinkDialog({ item, open, onOpenChange, existingTargetIds }: {
  item: WorkItemResponse;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existingTargetIds: number[];
}) {
  const [linkType, setLinkType] = useState<LinkType>('RELATES_TO');
  const [keyword, setKeyword] = useState('');
  const [picked, setPicked] = useState<WorkItemResponse | null>(null);
  const { data: items = [] } = useProjectItems(item.projectId);
  const create = useCreateLink(item.id);

  const excluded = new Set([item.id, ...existingTargetIds]);
  const candidates = items
    .filter((w) => !excluded.has(w.id))
    .filter((w) => {
      const q = keyword.trim().toLowerCase();
      return !q || w.title.toLowerCase().includes(q) || w.key.toLowerCase().includes(q);
    })
    .slice(0, 20);

  function close() {
    if (create.isPending) return;
    onOpenChange(false);
    setTimeout(() => { setKeyword(''); setPicked(null); setLinkType('RELATES_TO'); }, 200);
  }

  function submit() {
    if (!picked) return;
    create.mutate({ linkType, targetId: picked.id }, { onSuccess: close });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>업무 연결</DialogTitle>
          <DialogDescription>연결 유형을 고르고 같은 프로젝트의 항목을 선택합니다.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Select value={linkType} onValueChange={(v) => setLinkType(v as LinkType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LINK_TYPES.map((t) => <SelectItem key={t} value={t}>{LINK_TYPE_LABEL[t]}</SelectItem>)}
            </SelectContent>
          </Select>

          {picked ? (
            <div className="flex items-center gap-2 rounded-md border border-border p-2.5 text-sm">
              <TypeBadge type={picked.issueType} withLabel={false} />
              <span className="font-mono text-xs text-muted-foreground">{picked.key}</span>
              <span className="flex-1 truncate">{picked.title}</span>
              <Button variant="ghost" size="sm" onClick={() => setPicked(null)}>변경</Button>
            </div>
          ) : (
            <>
              <SearchInput placeholder="key·제목으로 검색" value={keyword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeyword(e.target.value)} />
              <div className="max-h-48 overflow-y-auto rounded-md border border-border">
                {candidates.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">연결할 항목이 없습니다</div>
                ) : (
                  candidates.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setPicked(w)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50"
                    >
                      <TypeBadge type={w.issueType} withLabel={false} />
                      <span className="font-mono text-xs text-muted-foreground">{w.key}</span>
                      <span className="flex-1 truncate">{w.title}</span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" disabled={create.isPending} onClick={close}>취소</Button>
          <Button variant="primary" disabled={create.isPending || !picked} onClick={submit}>
            {create.isPending ? <Spinner className="size-4" /> : <Link2 className="size-4" />} 연결
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
