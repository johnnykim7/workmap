// 백로그 Epic 필터(§6.1) — 순수 함수. 선택 Epic 소속 항목 + 그 Epic 자신만 남긴다.
// epicFilter='ALL'이면 전체 통과. Epic은 느슨한 그룹핑(epicId)이라 트리가 아닌 필터로 좁힌다.
import type { WorkItemResponse } from '@/types/domain';

export function filterByEpic<T extends Pick<WorkItemResponse, 'id' | 'epicId'>>(
  items: T[],
  epicFilter: string,
): T[] {
  if (epicFilter === 'ALL') return items;
  const fid = Number(epicFilter);
  if (Number.isNaN(fid)) return items;
  return items.filter((it) => it.epicId === fid || it.id === fid);
}
