// 백로그 낙관적 reducer(moveItem) 단위 테스트 — 스프린트↔백로그 이동 + 카운트 재계산.
import { describe, expect, it } from 'vitest';
import { moveItem } from './hooks';
import type { BacklogResponse } from './api';
import type { Sprint, WorkItemResponse } from '@/types/domain';

function item(id: number, sprintId: number | null, sp = 0): WorkItemResponse {
  return {
    id, key: `WMP-${id}`, projectId: 1, issueType: 'STORY', title: `t${id}`,
    commonStatus: 'TODO', priority: 'MEDIUM', progress: 0, sprintId, storyPoints: sp,
  };
}
function sprint(id: number): Sprint {
  return { id, projectId: 1, name: `S${id}`, status: 'FUTURE' };
}

function data(): BacklogResponse {
  return {
    projectId: 1,
    sprints: [
      { sprint: sprint(10), items: [item(1, 10, 3), item(2, 10, 5)], itemCount: 2, storyPointsSum: 8 },
      { sprint: sprint(20), items: [], itemCount: 0, storyPointsSum: 0 },
    ],
    backlog: { sprint: null, items: [item(3, null, 2)], itemCount: 1, storyPointsSum: 2 },
  };
}

describe('moveItem (백로그 낙관적 이동)', () => {
  it('스프린트에서_다른스프린트로_이동', () => {
    const next = moveItem(data(), 1, 20);
    expect(next.sprints[0].items.map((i) => i.id)).toEqual([2]);
    expect(next.sprints[1].items.map((i) => i.id)).toEqual([1]);
    expect(next.sprints[1].items[0].sprintId).toBe(20);
  });

  it('스프린트에서_백로그로_이동시_sprintId_null', () => {
    const next = moveItem(data(), 2, null);
    expect(next.backlog.items.map((i) => i.id)).toContain(2);
    const moved = next.backlog.items.find((i) => i.id === 2)!;
    expect(moved.sprintId).toBeNull();
  });

  it('이동후_itemCount와_storyPointsSum_재계산', () => {
    const next = moveItem(data(), 1, 20); // sp=3 항목을 S10→S20
    expect(next.sprints[0].itemCount).toBe(1);
    expect(next.sprints[0].storyPointsSum).toBe(5);
    expect(next.sprints[1].itemCount).toBe(1);
    expect(next.sprints[1].storyPointsSum).toBe(3);
  });

  it('백로그에서_스프린트로_이동시_백로그카운트감소', () => {
    const next = moveItem(data(), 3, 10);
    expect(next.backlog.itemCount).toBe(0);
    expect(next.backlog.storyPointsSum).toBe(0);
    expect(next.sprints[0].itemCount).toBe(3);
  });

  it('없는항목_원본그대로반환', () => {
    const d = data();
    expect(moveItem(d, 999, 20)).toBe(d);
  });
});
