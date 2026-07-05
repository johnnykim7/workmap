// 전체 보기 WS별 그룹핑(CR-045) 순수 함수 테스트 — node 환경(DOM 무의존).
import { describe, expect, it } from 'vitest';
import { groupByWorkspace } from './ws-group';

type P = { id: number; workspaceId: number };
const wsName = new Map<number, string>([
  [10, '물류 솔루션'],
  [20, '공통 인프라'],
  [30, '반품구조대'],
]);

describe('groupByWorkspace', () => {
  it('workspaceId별로_묶고_각그룹_내_원본순서_유지', () => {
    const projects: P[] = [
      { id: 1, workspaceId: 10 },
      { id: 2, workspaceId: 20 },
      { id: 3, workspaceId: 10 },
      { id: 4, workspaceId: 20 },
    ];
    const groups = groupByWorkspace(projects, [10, 20, 30], wsName);
    const g10 = groups.find((g) => g.id === 10)!;
    const g20 = groups.find((g) => g.id === 20)!;
    expect(g10.projects.map((p) => p.id)).toEqual([1, 3]);
    expect(g20.projects.map((p) => p.id)).toEqual([2, 4]);
  });

  it('그룹_순서는_wsOrder를_따른다', () => {
    const projects: P[] = [
      { id: 1, workspaceId: 30 },
      { id: 2, workspaceId: 10 },
      { id: 3, workspaceId: 20 },
    ];
    const groups = groupByWorkspace(projects, [10, 20, 30], wsName);
    expect(groups.map((g) => g.id)).toEqual([10, 20, 30]);
  });

  it('프로젝트없는_WS는_그룹을_만들지_않는다', () => {
    const projects: P[] = [{ id: 1, workspaceId: 10 }];
    const groups = groupByWorkspace(projects, [10, 20, 30], wsName);
    expect(groups.map((g) => g.id)).toEqual([10]);
  });

  it('그룹헤더에_WS_이름을_해소한다', () => {
    const projects: P[] = [{ id: 1, workspaceId: 20 }];
    const groups = groupByWorkspace(projects, [10, 20], wsName);
    expect(groups[0].name).toBe('공통 인프라');
  });

  it('wsOrder에_없는_WS는_뒤에_id오름차순으로_붙고_이름은_폴백', () => {
    const projects: P[] = [
      { id: 1, workspaceId: 10 },
      { id: 2, workspaceId: 99 }, // wsName/wsOrder에 없음(경계)
      { id: 3, workspaceId: 50 }, // wsName/wsOrder에 없음(경계)
    ];
    const groups = groupByWorkspace(projects, [10], wsName);
    // 순서: wsOrder의 10 → 나머지 오름차순 50, 99
    expect(groups.map((g) => g.id)).toEqual([10, 50, 99]);
    expect(groups.find((g) => g.id === 99)!.name).toBe('WS #99');
  });

  it('빈_프로젝트면_빈_배열', () => {
    expect(groupByWorkspace([], [10, 20], wsName)).toEqual([]);
  });
});
