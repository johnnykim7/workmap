// 프로젝트 탭 순수 로직 (CR-019) — react/ds-ui 무의존, 단위 테스트 친화.
import type { ProjectTab } from '@/lib/route-paths';

// 켜고 끌 수 있는 탭 전체(route-paths 실존 8탭). summary는 항상 노출(끄기 불가).
export const ALL_TABS: ProjectTab[] = [
  'summary', 'list', 'board', 'backlog', 'timeline', 'calendar', 'approvals', 'reports',
];

// [+] 탭 추가 시 다음 activeTabs 계산 — summary 항상 포함, 중복 제거, route 순서 정렬,
// ALL_TABS에 없는 유령 값(예: 과거 'issues')은 제외.
export function nextActiveTabs(base: string[], tab: string): string[] {
  const next = new Set(['summary', ...base, tab]);
  return ALL_TABS.filter((t) => next.has(t));
}

// 탭 제거 — summary는 제거 불가. 유령 값 제외(유효한 코드만 유지).
export function removeTab(base: string[], tab: string): string[] {
  if (tab === 'summary') return base.filter((t) => ALL_TABS.includes(t as never));
  return base.filter((t) => t !== tab && ALL_TABS.includes(t as never));
}

// 탭 이동 — base 배열에서 tab을 dir(-1=왼쪽,+1=오른쪽)로 한 칸 이동.
// summary는 항상 맨 앞 고정(이동 대상/대상 위치 모두 불가).
export function moveTab(base: string[], tab: string, dir: -1 | 1): string[] {
  if (tab === 'summary') return base;
  const arr = base.filter((t) => ALL_TABS.includes(t as never));
  const i = arr.indexOf(tab);
  if (i < 0) return arr;
  const j = i + dir;
  // 범위 밖이거나, summary(맨 앞) 자리로는 못 감.
  if (j < 0 || j >= arr.length) return arr;
  if (arr[j] === 'summary') return arr;
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

// 드래그&드롭 재정렬(CR-020) — active(끌린 탭)를 over(놓인 탭) 위치로 이동.
// summary는 항상 맨 앞 고정: summary를 끌거나 summary 앞으로 놓는 결과는 무시.
export function reorderTabs(base: string[], activeCode: string, overCode: string): string[] {
  const arr = base.filter((t) => ALL_TABS.includes(t as never));
  if (activeCode === 'summary' || activeCode === overCode) return arr;
  const from = arr.indexOf(activeCode);
  const to = arr.indexOf(overCode);
  if (from < 0 || to < 0) return arr;
  const copy = [...arr];
  copy.splice(from, 1);
  copy.splice(to, 0, activeCode);
  // summary가 맨 앞이 아니게 되면(=summary 앞으로 끌어옴) 원복.
  if (copy[0] !== 'summary' && arr[0] === 'summary') return arr;
  return copy;
}
