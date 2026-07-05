// 백로그 행(§6.1) — 스프린트/백로그 구역의 항목 한 줄. 드래그로 구역 이동(useDraggable).
// 표시: 유형·키·제목·우선순위·추정·담당자·상태. 색은 상태/우선순위/막힘 신호에만.
import { useDraggable } from '@dnd-kit/core';
import {
  Select, SelectContent, SelectItem, SelectTrigger,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from '@therecommerce/ds-ui';
import type { WorkItemResponse } from '@/types/domain';
import { isWorkItemDelayed } from '@/types/domain';
import { TypeBadge, PriorityBadge, StatusBadge, EpicChip } from '@/components/badges';
import { UserAvatar } from '@/components/common/user-avatar';
import { epicColor } from '../epic-color';
import { GripVertical, CalendarClock, Layers, MoreHorizontal, Inbox, ArrowRight } from 'lucide-react';

const NO_EPIC = '__no_epic__';

interface Props {
  item: WorkItemResponse;
  assigneeName?: string;
  onClick?: () => void;
  // Epic 소속 칩(§6.1) — 이 항목이 매달린 Epic 이름. Epic 자신/소속 없음이면 undefined.
  epicName?: string;
  // 행에서 직접 Epic 변경(§6.1, Jira식 인라인 연결). 후보 + 변경 핸들러가 있으면 칩이 드롭다운이 된다.
  epicOptions?: { id: number; title: string }[];
  onChangeEpic?: (epicId: number | null) => void;
  // 행 … 메뉴 스프린트 이동/백로그 되돌리기 — 이동 대상 스프린트 목록 + 핸들러(sprintId=null=백로그).
  sprintOptions?: { id: number; name: string }[];
  onMoveToSprint?: (sprintId: number | null) => void;
}

export function BacklogRow({ item, assigneeName, onClick, epicName, epicOptions, onChangeEpic, sprintOptions, onMoveToSprint }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `bl-${item.id}`,
    data: { workItemId: item.id, sprintId: item.sprintId ?? null },
  });
  const delayed = isWorkItemDelayed(item);

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-2 border-b border-border bg-card px-2 py-1.5 last:border-b-0 hover:bg-muted/40 ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground active:cursor-grabbing"
        aria-label="드래그하여 이동"
      >
        <GripVertical className="size-4" />
      </button>

      <TypeBadge type={item.issueType} withLabel={false} />
      <span className="font-mono text-[11px] text-muted-foreground">{item.key}</span>

      <button onClick={onClick} className="min-w-0 flex-1 truncate text-left text-sm text-foreground hover:underline">
        {item.title}
      </button>

      {/* 우측 메타 — 폭 고정 슬롯으로 정렬해 행마다 위치가 들쭉날쭉하지 않게(#23). */}
      {/* Epic 연결(§6.1) — 변경 가능하면 드롭다운, 아니면 칩만. Epic 자신엔 표시 안 함(상위 호출부 제어). */}
      <div className="flex w-36 shrink-0 justify-start">
        {onChangeEpic && epicOptions ? (
          <Select
            value={item.epicId != null ? String(item.epicId) : NO_EPIC}
            onValueChange={(v) => onChangeEpic(v === NO_EPIC ? null : Number(v))}
          >
            <SelectTrigger
              className="h-6 w-auto max-w-full flex-nowrap gap-1 whitespace-nowrap border-none bg-transparent px-0 shadow-none focus:ring-0 [&>svg]:shrink-0"
              aria-label="Epic 연결 변경"
            >
              {/* ds-ui SelectTrigger base가 직계 span에 `line-clamp-1`(세로 box)을 강제해 아이콘/텍스트가
                  세로로 쌓였다(#23). EpicChip(span 버전)·placeholder 모두 div로 감싸 그 영향을 피한다. */}
              {epicName ? (
                <div className="flex min-w-0 max-w-full items-center"><EpicChip name={epicName} color={epicColor(item.epicId)} /></div>
              ) : (
                <div className="flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted">
                  <Layers className="size-3 shrink-0" /> Epic 지정
                </div>
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_EPIC}>없음</SelectItem>
              {epicOptions.map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>{e.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          epicName && <EpicChip name={epicName} color={epicColor(item.epicId)} />
        )}
      </div>

      <div className="flex w-16 shrink-0 justify-start">
        {item.dueDate && (
          <span className={`inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] ${delayed ? 'font-medium text-red-600' : 'text-muted-foreground'}`}>
            <CalendarClock className="size-3 shrink-0" />
            {item.dueDate.slice(5).replace('-', '/')}
          </span>
        )}
      </div>
      <div className="flex w-7 shrink-0 justify-center">
        {item.storyPoints != null && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{item.storyPoints}</span>
        )}
      </div>
      <div className="flex w-6 shrink-0 justify-center"><PriorityBadge priority={item.priority} /></div>
      <div className="flex w-20 shrink-0 justify-center"><StatusBadge status={item.commonStatus} /></div>
      <div className="flex w-6 shrink-0 justify-center"><UserAvatar userId={item.assigneeId} name={assigneeName} size="sm" noCard /></div>

      {/* 행 … 메뉴 — 드래그 대신 클릭으로 스프린트 이동/백로그 되돌리기(드래그 조준 부담 없음). */}
      <div className="flex w-6 shrink-0 justify-center">
        {onMoveToSprint && (() => {
          const inBacklog = item.sprintId == null;
          const targets = (sprintOptions ?? []).filter((s) => s.id !== item.sprintId);
          // 되돌리기(백로그에 이미 있으면 불필요) + 이동 대상 스프린트가 하나도 없으면 메뉴 숨김.
          if (inBacklog && targets.length === 0) return null;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="이동 메뉴"
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!inBacklog && (
                  <DropdownMenuItem onClick={() => onMoveToSprint(null)}>
                    <Inbox className="size-4" /> 백로그로 되돌리기
                  </DropdownMenuItem>
                )}
                {targets.length > 0 && (
                  <>
                    {!inBacklog && <DropdownMenuSeparator />}
                    <DropdownMenuLabel>스프린트로 이동</DropdownMenuLabel>
                    {targets.map((s) => (
                      <DropdownMenuItem key={s.id} onClick={() => onMoveToSprint(s.id)}>
                        <ArrowRight className="size-4" /> {s.name}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })()}
      </div>
    </div>
  );
}
