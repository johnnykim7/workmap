// 보드 낙관적 reducer(moveCard) 단위 테스트 — DnD 드롭 시 캐시 변형 로직(T1-5 UI FSM).
import { describe, expect, it } from 'vitest';
import { moveCard } from './hooks';
import type { BoardResponse } from './api';
import type { WorkItemResponse } from '@/types/domain';

function card(id: number, statusId: number, over: Partial<WorkItemResponse> = {}): WorkItemResponse {
  return {
    id, key: `WMP-${id}`, projectId: 1, issueType: 'TASK', title: `t${id}`,
    commonStatus: 'TODO', priority: 'MEDIUM', statusId, progress: 0, ...over,
  };
}

function board(): BoardResponse {
  return {
    projectId: 1, workflowId: 10, sprintId: null,
    columns: [
      { statusId: 100, code: 'TODO', label: '할 일', commonStatus: 'TODO', isDone: false, isApproval: false, cards: [card(1, 100), card(2, 100)] },
      { statusId: 200, code: 'INP', label: '진행', commonStatus: 'IN_PROGRESS', isDone: false, isApproval: false, cards: [] },
      { statusId: 900, code: 'BLK', label: '막힘', commonStatus: 'BLOCKED', isDone: false, isApproval: false, cards: [] },
    ],
  };
}

describe('moveCard (보드 낙관적 이동)', () => {
  it('카드를_다른컬럼으로_이동하면_출발컬럼에서빠지고_도착컬럼에추가', () => {
    const next = moveCard(board(), 1, 200);
    const todo = next.columns.find((c) => c.statusId === 100)!;
    const inp = next.columns.find((c) => c.statusId === 200)!;
    expect(todo.cards.map((c) => c.id)).toEqual([2]);
    expect(inp.cards.map((c) => c.id)).toEqual([1]);
  });

  it('도착컬럼_commonStatus를_카드에반영', () => {
    const next = moveCard(board(), 1, 200);
    const moved = next.columns.flatMap((c) => c.cards).find((c) => c.id === 1)!;
    expect(moved.statusId).toBe(200);
    expect(moved.commonStatus).toBe('IN_PROGRESS');
  });

  it('BLOCKED컬럼이동시_blockReason반영', () => {
    const next = moveCard(board(), 1, 900, '외부 승인 대기');
    const moved = next.columns.flatMap((c) => c.cards).find((c) => c.id === 1)!;
    expect(moved.commonStatus).toBe('BLOCKED');
    expect(moved.blockReason).toBe('외부 승인 대기');
  });

  it('비BLOCKED컬럼이동시_blockReason은_null로해제', () => {
    const start = board();
    start.columns[0].cards[0] = card(1, 100, { commonStatus: 'BLOCKED', blockReason: '이전 막힘' });
    const next = moveCard(start, 1, 200);
    const moved = next.columns.flatMap((c) => c.cards).find((c) => c.id === 1)!;
    expect(moved.blockReason).toBeNull();
  });

  it('없는카드_원본그대로반환', () => {
    const b = board();
    expect(moveCard(b, 999, 200)).toBe(b);
  });

  it('없는컬럼_원본그대로반환', () => {
    const b = board();
    expect(moveCard(b, 1, 777)).toBe(b);
  });
});
