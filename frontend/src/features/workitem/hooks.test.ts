// 업무 상세 순수 헬퍼 단위테스트 — key→item 정확 해소 + 하위작업 거르기.
import { describe, it, expect } from 'vitest';
import { exactByKey, pickSubtasks } from './hooks';
import type { WorkItemResponse } from '@/types/domain';

function wi(p: Partial<WorkItemResponse> & { id: number; key: string }): WorkItemResponse {
  return {
    projectId: 1, issueType: 'TASK', title: `t${p.id}`, commonStatus: 'TODO',
    priority: 'MEDIUM', progress: 0, ...p,
  } as WorkItemResponse;
}

describe('exactByKey — keyword 부분일치에서 정확 key 선별', () => {
  const items = [
    wi({ id: 1, key: 'ZGOH-2' }),
    wi({ id: 2, key: 'ZGOH-20' }),  // 'ZGOH-2' ILIKE 부분일치로 함께 옴
    wi({ id: 3, key: 'ZGOH-21' }),
  ];

  it('정확key존재_정확매칭만반환', () => {
    expect(exactByKey(items, 'ZGOH-2')?.id).toBe(1);
    expect(exactByKey(items, 'ZGOH-20')?.id).toBe(2);
  });

  it('대소문자무관_매칭', () => {
    expect(exactByKey(items, 'zgoh-2')?.id).toBe(1);
  });

  it('없는key_undefined', () => {
    expect(exactByKey(items, 'ZGOH-99')).toBeUndefined();
  });
});

describe('pickSubtasks — parentId로 하위작업 거르기', () => {
  const items = [
    wi({ id: 10, key: 'P-1' }),
    wi({ id: 11, key: 'P-1-a', parentId: 10 }),
    wi({ id: 12, key: 'P-1-b', parentId: 10 }),
    wi({ id: 13, key: 'P-2', parentId: 99 }),
  ];

  it('해당부모자식만반환', () => {
    expect(pickSubtasks(items, 10).map((w) => w.id)).toEqual([11, 12]);
  });

  it('자식없음_빈배열', () => {
    expect(pickSubtasks(items, 10).filter((w) => w.id === 13)).toHaveLength(0);
    expect(pickSubtasks(undefined, 10)).toEqual([]);
  });
});
