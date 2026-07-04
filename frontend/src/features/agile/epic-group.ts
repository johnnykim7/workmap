// 백로그 Epic별 그룹핑(CR-036) — 순수 함수. 백로그 영역 항목을 epicId로 묶는다.
// 우선순위순(평면)이 기본이고, 이 그룹핑은 "Epic별" 보기 토글에서만 쓴다(CR-022 평면 기본 유지).
import type { WorkItemResponse } from '@/types/domain';

export interface EpicGroup<T> {
  epicId: number | null; // null = "Epic 미지정" 그룹
  items: T[];
}

// items를 epicId로 그룹핑. Epic 미지정(null)은 항상 마지막.
// Epic 그룹 순서 = epicOrder(프로젝트 EPIC 등장 순서)를 따르고, 없으면 등장 순서.
// 원본 항목 순서(서버 우선순위 정렬)는 각 그룹 내에서 유지한다.
export function groupByEpic<T extends Pick<WorkItemResponse, 'epicId'>>(
  items: T[],
  epicOrder: number[] = [],
): EpicGroup<T>[] {
  const buckets = new Map<number | null, T[]>();
  for (const it of items) {
    const key = it.epicId ?? null;
    const arr = buckets.get(key);
    if (arr) arr.push(it);
    else buckets.set(key, [it]);
  }

  const order = new Map<number, number>();
  epicOrder.forEach((id, i) => order.set(id, i));

  const epicKeys = [...buckets.keys()].filter((k): k is number => k != null);
  epicKeys.sort((a, b) => {
    const oa = order.has(a) ? order.get(a)! : Number.MAX_SAFE_INTEGER;
    const ob = order.has(b) ? order.get(b)! : Number.MAX_SAFE_INTEGER;
    return oa !== ob ? oa - ob : a - b;
  });

  const groups: EpicGroup<T>[] = epicKeys.map((k) => ({ epicId: k, items: buckets.get(k)! }));
  if (buckets.has(null)) groups.push({ epicId: null, items: buckets.get(null)! });
  return groups;
}
