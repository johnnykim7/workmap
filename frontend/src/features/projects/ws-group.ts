// 전체 보기 모드(CR-045, WMP-WS-009) — 프로젝트를 WS별로 그룹핑하는 순수 로직.
// 격리(BIZ-112)는 서버가 강제(내 멤버 WS만 반환)하므로 여기선 순수 그룹핑만.

export interface WsGroup<P> {
  id: number;
  name: string;
  projects: P[];
}

/**
 * 프로젝트를 workspaceId별로 그룹핑한다.
 * - 그룹 순서 = wsOrder(내 WS 목록 순서). 프로젝트가 없는 WS는 그룹을 만들지 않는다.
 * - wsOrder에 없는 WS(경계 케이스)는 뒤에 오름차순으로 붙인다.
 * - 각 그룹 내 프로젝트 순서 = 원본(응답) 순서 유지.
 * @param projects 프로젝트 목록(각 항목에 workspaceId)
 * @param wsOrder  WS 표시 순서(id 배열)
 * @param wsName   WS id→이름 맵. 없으면 "WS #{id}" 폴백.
 */
export function groupByWorkspace<P extends { workspaceId: number }>(
  projects: P[],
  wsOrder: number[],
  wsName: Map<number, string>,
): WsGroup<P>[] {
  const byWs = new Map<number, P[]>();
  for (const p of projects) {
    const arr = byWs.get(p.workspaceId) ?? [];
    arr.push(p);
    byWs.set(p.workspaceId, arr);
  }
  const ordered = [
    ...wsOrder.filter((id) => byWs.has(id)),
    ...[...byWs.keys()].filter((id) => !wsOrder.includes(id)).sort((a, b) => a - b),
  ];
  return ordered.map((id) => ({
    id,
    name: wsName.get(id) ?? `WS #${id}`,
    projects: byWs.get(id) ?? [],
  }));
}
