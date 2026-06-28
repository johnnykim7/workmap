// 백로그 Epic 필터(§6.1) 순수 함수 테스트 — node 환경(DOM 무의존).
import { describe, expect, it } from 'vitest';
import { filterByEpic } from './epic-filter';

type Row = { id: number; epicId: number | null };
const rows: Row[] = [
  { id: 100, epicId: null }, // Epic 자신(입고)
  { id: 1, epicId: 100 },    // 입고 소속
  { id: 2, epicId: 100 },    // 입고 소속
  { id: 3, epicId: 200 },    // 다른 Epic 소속
  { id: 4, epicId: null },   // 소속 없음
];

describe('filterByEpic', () => {
  it('ALL이면_전체통과', () => {
    expect(filterByEpic(rows, 'ALL')).toHaveLength(5);
  });

  it('특정Epic선택_소속항목과_그Epic자신만_남김', () => {
    const out = filterByEpic(rows, '100');
    // 소속(1,2) + Epic 자신(100) = 3건. 다른Epic(3)·무소속(4) 제외.
    expect(out.map((r) => r.id).sort((a, b) => a - b)).toEqual([1, 2, 100]);
  });

  it('소속없는_Epic선택시_그Epic자신만', () => {
    const out = filterByEpic(rows, '200');
    expect(out.map((r) => r.id)).toEqual([3]); // 200 소속(3)만, Epic 200 자신은 목록에 없음
  });

  it('숫자아닌값이면_전체통과_방어', () => {
    expect(filterByEpic(rows, 'xyz')).toHaveLength(5);
  });
});
