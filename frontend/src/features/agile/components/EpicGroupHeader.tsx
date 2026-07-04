// Epic 그룹 헤더(CR-036) — 백로그 "Epic별" 보기에서 각 Epic 묶음 위의 접기/펼치기 헤더.
// Epic별 고유 색(epicColor) 칩 + 이름 + 항목수. 미지정 그룹은 중립 톤.
import { ChevronRight, ChevronDown, Layers } from 'lucide-react';
import { EpicChip } from '@/components/badges';
import type { EpicColor } from '../epic-color';

interface Props {
  name: string;        // Epic 이름 또는 "Epic 미지정"
  color?: EpicColor;   // 미지정이면 생략(중립)
  count: number;
  collapsed: boolean;
  onToggle: () => void;
}

export function EpicGroupHeader({ name, color, count, collapsed, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2 rounded-t-md bg-muted/60 px-3 py-2 text-left hover:bg-muted"
    >
      {collapsed ? <ChevronRight className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      {color ? (
        <EpicChip name={name} color={color} />
      ) : (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
          <Layers className="size-3.5" /> {name}
        </span>
      )}
      <span className="text-xs text-muted-foreground">{count}건</span>
    </button>
  );
}
