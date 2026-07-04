// 분할 화면(§9.5) — 좌측 항목 리스트 + 우측 업무 상세 패널(§9.3 구조 그대로).
// 리스트 클릭 시 우측 즉시 갱신(페이지 이동 없음). 선택 항목은 list 응답의 WorkItemResponse를 그대로 사용.
import { StatusBadge, TypeBadge, PriorityBadge } from '@/components/badges';
import { EmptyState } from '@/components/common/empty-state';
import { MousePointerClick } from 'lucide-react';
import { type WorkItemResponse, type Sprint } from '@/types/domain';
import { WorkItemDetailPanel } from './WorkItemDetailPanel';

interface Props {
  items: WorkItemResponse[];
  sprints: Sprint[];
  selected?: WorkItemResponse;
  onSelect: (item: WorkItemResponse) => void;
}

export function SplitView({ items, sprints, selected, onSelect }: Props) {
  return (
    <div className="flex items-start gap-4">
      {/* 좌측 리스트 — 본문과 분리해 자기 영역대로 스크롤(sticky 고정).
          AdminShell 헤더 h-14(56px) + AppShell 본문 p-5(20px) 아래에 붙는다. */}
      <div className="sticky top-5 max-h-[calc(100vh-56px-40px)] w-72 shrink-0 overflow-y-auto rounded-lg border border-border">
        <ul className="divide-y divide-border">
          {items.map((it) => (
            <li key={it.id}>
              <button
                type="button"
                onClick={() => onSelect(it)}
                data-active={selected?.id === it.id || undefined}
                className={`flex w-full flex-col gap-1 border-l-2 px-3 py-2.5 text-left transition-colors ${
                  selected?.id === it.id
                    ? 'border-l-primary bg-primary/10'
                    : 'border-l-transparent hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <TypeBadge type={it.issueType} withLabel={false} />
                  <span className="font-mono text-xs text-muted-foreground">{it.key}</span>
                  <PriorityBadge priority={it.priority} />
                </div>
                <span className="truncate text-sm">{it.title}</span>
                <StatusBadge status={it.commonStatus} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 우측 상세 */}
      <div className="min-w-0 flex-1">
        {selected ? (
          <WorkItemDetailPanel key={selected.id} item={selected} sprints={sprints} stacked />
        ) : (
          <EmptyState
            icon={<MousePointerClick className="size-6" />}
            title="항목을 선택하세요"
            description="왼쪽 목록에서 업무를 클릭하면 여기에 상세가 표시됩니다."
          />
        )}
      </div>
    </div>
  );
}
