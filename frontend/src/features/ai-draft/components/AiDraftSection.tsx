// 백로그 "AI 초안" 구역 (WMP-WI-019, CR-050) — draft=true 항목을 구분표시.
// 옅은 배경 + "초안" 배지 + 행별 [담기]/[삭제] + 헤더 [전체 담기]/[전체 버리기](destructive).
// 계층: Story/Task 초안은 소속 Epic이 아직 초안(미확정)이면 담기 비활성(먼저 Epic 담기 — BIZ-117).
import { useState } from 'react';
import { Button } from '@therecommerce/ds-ui';
import { Sparkles, Check, X, Trash2 } from 'lucide-react';
import type { WorkItemResponse } from '@/types/domain';
import { TypeBadge } from '@/components/badges';
import { ConfirmDialog } from '@/components/common/confirm-dialog';

interface Props {
  drafts: WorkItemResponse[];
  canWrite: boolean;
  onConfirmOne: (id: number) => void;
  onConfirmAll: () => void;
  onDeleteOne: (id: number) => void;
  onDiscardAll: () => void;
  onItemClick?: (id: number) => void;
  busy?: boolean;
}

export function AiDraftSection({
  drafts, canWrite, onConfirmOne, onConfirmAll, onDeleteOne, onDiscardAll, onItemClick, busy,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  if (drafts.length === 0) return null;

  // 아직 초안인 Epic id 집합 — 그 하위(Story/Task) 초안은 담기 비활성(먼저 Epic 확정).
  const draftEpicIds = new Set(
    drafts.filter((d) => d.issueType === 'EPIC').map((d) => d.id),
  );
  const canConfirm = (d: WorkItemResponse) => {
    if (d.epicId != null && draftEpicIds.has(d.epicId)) return false; // Epic이 아직 초안
    if (d.parentId != null && draftEpicIds.has(d.parentId)) return false;
    return true;
  };

  return (
    <section className="rounded-md border border-primary/30 bg-primary/5">
      <div className="flex items-center gap-3 rounded-t-md bg-primary/10 px-3 py-2">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-1.5 text-sm font-medium text-foreground"
        >
          <Sparkles className="size-4 text-primary" />
          AI 초안
          <span className="text-xs text-muted-foreground">({drafts.length})</span>
        </button>
        <span className="text-xs text-muted-foreground">검토 후 담기·수정·삭제하세요</span>
        {canWrite && (
          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="primary" size="sm" onClick={onConfirmAll} disabled={busy}>
              <Check className="size-3.5" /> 전체 담기
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDiscardOpen(true)} disabled={busy}>
              <Trash2 className="size-3.5" /> 전체 버리기
            </Button>
          </div>
        )}
      </div>

      {!collapsed && (
        <div>
          {drafts.map((d) => {
            const confirmable = canConfirm(d);
            return (
              <div
                key={d.id}
                className="flex items-center gap-2 border-b border-primary/15 px-3 py-1.5 last:border-b-0 hover:bg-primary/5"
              >
                <TypeBadge type={d.issueType} withLabel={false} />
                <span className="font-mono text-[11px] text-muted-foreground">{d.key}</span>
                <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">초안</span>
                <button
                  onClick={() => onItemClick?.(d.id)}
                  className="min-w-0 flex-1 truncate text-left text-sm text-foreground hover:underline"
                >
                  {d.title}
                </button>
                {canWrite && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onConfirmOne(d.id)}
                      disabled={busy || !confirmable}
                      title={confirmable ? '담기' : '먼저 소속 Epic을 담으세요'}
                    >
                      <Check className="size-3.5" /> 담기
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteOne(d.id)}
                      disabled={busy}
                      aria-label="초안 삭제"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="AI 초안 전체 버리기"
        description={`초안 ${drafts.length}건을 모두 버립니다. 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="전체 버리기"
        busy={busy}
        onConfirm={() => {
          onDiscardAll();
          setDiscardOpen(false);
        }}
      />
    </section>
  );
}
