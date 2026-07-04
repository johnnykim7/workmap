// 공통 페이지 헤더 — 설명 + 우측 액션. 전 화면 톤 통일.
// title은 GNB 헤더가 이미 화면명을 표시하므로 본문 h1로 중복 렌더하지 않는다(desc/actions만).
// title prop은 호출부 호환을 위해 유지하되 렌더하지 않는다.
import type { ReactNode } from 'react';

export function PageHead({
  desc,
  actions,
}: {
  title?: string;
  desc?: string;
  actions?: ReactNode;
}) {
  if (!desc && !actions) return null;
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
