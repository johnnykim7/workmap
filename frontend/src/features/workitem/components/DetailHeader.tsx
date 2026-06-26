// 업무 상세 상단 바(§9.3) — key · 이전/다음 화살표 · 워치 · 공유 · +액션 메뉴 · 구성 · 제목 인라인 편집.
// 상태 전이는 워크플로 상태 Select(보드와 동일 FSM 경유). BLOCKED 전이 시 사유 모달.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, toast,
} from '@therecommerce/ds-ui';
import {
  ChevronUp, ChevronDown, Eye, Share2, Plus, Settings, GitBranch, Link2, Paperclip,
} from 'lucide-react';
import { TypeBadge } from '@/components/badges';
import { ROUTES } from '@/lib/route-paths';
import { useBoard } from '@/features/board/hooks';
import { type WorkItemResponse } from '@/types/domain';
import { useUpdateWorkItem, useChangeStatus } from '../hooks';
import { BlockReasonDialog } from '@/features/board/components/BlockReasonDialog';

interface Props {
  item: WorkItemResponse;
  onAddSubtask: () => void;
  onAddLink: () => void;
}

export function DetailHeader({ item, onAddSubtask, onAddLink }: Props) {
  const navigate = useNavigate();
  const update = useUpdateWorkItem(item.id, item.key);
  const changeStatus = useChangeStatus(item.id, item.key);
  // 워크플로 상태 목록 = 보드 컬럼(같은 프로젝트). 상태 전이 옵션·라벨 출처.
  const { data: board } = useBoard(item.projectId);
  const columns = board?.columns ?? [];

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [pendingBlockStatusId, setPendingBlockStatusId] = useState<number | null>(null);
  useEffect(() => { setTitle(item.title); }, [item.title]);

  // 목록 내 이전/다음 = 같은 프로젝트 카드 순서(보드 평탄화 기준). 보드 미로딩 시 비활성.
  const ordered = columns.flatMap((c) => c.cards);
  const idx = ordered.findIndex((c) => c.id === item.id);
  const prev = idx > 0 ? ordered[idx - 1] : undefined;
  const next = idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : undefined;

  const current = columns.find((c) => c.statusId === item.statusId);

  function commitTitle() {
    const t = title.trim();
    setEditing(false);
    if (!t || t === item.title) { setTitle(item.title); return; }
    update.mutate({ title: t });
  }

  function onStatusChange(v: string) {
    const toStatusId = Number(v);
    if (toStatusId === item.statusId) return;
    const target = columns.find((c) => c.statusId === toStatusId);
    if (target?.commonStatus === 'BLOCKED') {
      setPendingBlockStatusId(toStatusId); // BIZ-005: 사유 먼저
      return;
    }
    changeStatus.mutate({ toStatusId });
  }

  return (
    <TooltipProvider>
      <div className="mb-4 flex flex-col gap-3 border-b border-border pb-3">
        {/* 상단 액션 줄 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TypeBadge type={item.issueType} withLabel={false} />
            <span className="font-mono text-sm text-muted-foreground">{item.key}</span>
            <div className="flex items-center">
              <IconBtn label="이전 항목" disabled={!prev} onClick={() => prev && navigate(ROUTES.workItem(prev.key))}>
                <ChevronUp className="size-4" />
              </IconBtn>
              <IconBtn label="다음 항목" disabled={!next} onClick={() => next && navigate(ROUTES.workItem(next.key))}>
                <ChevronDown className="size-4" />
              </IconBtn>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <IconBtn label="구독(워치)" onClick={() => toast.info('워치 기능은 준비 중입니다.')}>
              <Eye className="size-4" />
            </IconBtn>
            <IconBtn
              label="공유 링크 복사"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href).then(
                  () => toast.success('링크를 복사했습니다.'),
                  () => toast.error('복사에 실패했습니다.'),
                );
              }}
            >
              <Share2 className="size-4" />
            </IconBtn>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  <Plus className="size-4" /> 액션
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onAddSubtask}>
                  <GitBranch className="size-4" /> 하위작업 추가
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onAddLink}>
                  <Link2 className="size-4" /> 업무 연결
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info('첨부는 준비 중입니다.')}>
                  <Paperclip className="size-4" /> 첨부
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <IconBtn label="필드 구성" onClick={() => navigate(ROUTES.admin.fieldSchemes)}>
              <Settings className="size-4" />
            </IconBtn>
          </div>
        </div>

        {/* 제목 인라인 편집 + 상태 */}
        <div className="flex items-start justify-between gap-3">
          {editing ? (
            <Input
              autoFocus
              className="text-lg font-semibold"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') { setTitle(item.title); setEditing(false); }
              }}
            />
          ) : (
            <h1
              className="cursor-text text-lg font-semibold text-foreground hover:bg-muted/40 rounded px-1 -mx-1"
              onClick={() => setEditing(true)}
              title="클릭하여 제목 편집"
            >
              {item.title}
            </h1>
          )}

          <div className="shrink-0">
            <Select value={item.statusId != null ? String(item.statusId) : ''} onValueChange={onStatusChange}>
              <SelectTrigger className="h-9 w-44">
                <SelectValue placeholder={current?.label ?? '상태'} />
              </SelectTrigger>
              <SelectContent>
                {columns.map((c) => (
                  <SelectItem key={c.statusId} value={String(c.statusId)}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <BlockReasonDialog
        open={pendingBlockStatusId != null}
        itemTitle={item.title}
        busy={changeStatus.isPending}
        onCancel={() => setPendingBlockStatusId(null)}
        onConfirm={(reason) => {
          if (pendingBlockStatusId == null) return;
          changeStatus.mutate(
            { toStatusId: pendingBlockStatusId, blockReason: reason },
            { onSettled: () => setPendingBlockStatusId(null) },
          );
        }}
      />
    </TooltipProvider>
  );
}

function IconBtn({ label, disabled, onClick, children }: {
  label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="sm" className="size-8 p-0" disabled={disabled} onClick={onClick} aria-label={label}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
