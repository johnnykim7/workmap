// 백로그 Epic별 그룹핑(CR-036) 순수 함수 테스트 — node 환경(DOM 무의존).
import { describe, expect, it } from 'vitest';
import { groupByEpic } from './epic-group';

type Row = { id: number; epicId: number | null };
const rows: Row[] = [
  { id: 1, epicId: 100 },
  { id: 2, epicId: 200 },
  { id: 3, epicId: 100 },
  { id: 4, epicId: null },
  { id: 5, epicId: 200 },
  { id: 6, epicId: null },
];

describe('groupByEpic', () => {
  it('epicId별로_묶고_각그룹_내_원본순서_유지', () => {
    const groups = groupByEpic(rows);
    const g100 = groups.find((g) => g.epicId === 100)!;
    const g200 = groups.find((g) => g.epicId === 200)!;
    expect(g100.items.map((r) => r.id)).toEqual([1, 3]);
    expect(g200.items.map((r) => r.id)).toEqual([2, 5]);
  });

  it('미지정(null)_그룹은_항상_마지막', () => {
    const groups = groupByEpic(rows);
    expect(groups[groups.length - 1].epicId).toBeNull();
    expect(groups[groups.length - 1].items.map((r) => r.id)).toEqual([4, 6]);
  });

  it('epicOrder_지정시_그_순서를_따른다', () => {
    // 200을 먼저, 100을 나중에 오도록 순서 지정.
    const groups = groupByEpic(rows, [200, 100]);
    const epicGroups = groups.filter((g) => g.epicId != null);
    expect(epicGroups.map((g) => g.epicId)).toEqual([200, 100]);
  });

  it('epicOrder에_없는_Epic은_뒤로_밀리고_id순', () => {
    // 200만 순서에 넣으면 200 먼저, 나머지(100)는 뒤에.
    const groups = groupByEpic(rows, [200]);
    const epicGroups = groups.filter((g) => g.epicId != null);
    expect(epicGroups.map((g) => g.epicId)).toEqual([200, 100]);
  });

  it('빈_배열이면_빈_그룹', () => {
    expect(groupByEpic([])).toEqual([]);
  });

  it('전부_미지정이면_단일_null그룹', () => {
    const out = groupByEpic([{ id: 1, epicId: null }, { id: 2, epicId: null }]);
    expect(out).toHaveLength(1);
    expect(out[0].epicId).toBeNull();
    expect(out[0].items.map((r) => r.id)).toEqual([1, 2]);
  });
});
