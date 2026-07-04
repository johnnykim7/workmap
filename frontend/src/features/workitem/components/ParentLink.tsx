// Sub-task 상위 작업 링크 — 상세 본문 밖(첨부 다음)에서 독립 섹션으로 노출.
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/route-paths';
import { StatusBadge, TypeBadge } from '@/components/badges';
import { useProjectItems } from '../hooks';

export function ParentLink({ parentId, projectId }: { parentId: number; projectId: number }) {
  const navigate = useNavigate();
  const { data: items = [] } = useProjectItems(projectId);
  const parent = items.find((w) => w.id === parentId);
  if (!parent) return <p className="text-sm text-muted-foreground">상위 작업 #{parentId}</p>;
  return (
    <button
      type="button"
      onClick={() => navigate(ROUTES.workItem(parent.key))}
      className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-muted/40"
    >
      <TypeBadge type={parent.issueType} withLabel={false} />
      <span className="font-mono text-xs text-muted-foreground">{parent.key}</span>
      <span className="flex-1 truncate">{parent.title}</span>
      <StatusBadge status={parent.commonStatus} />
    </button>
  );
}
