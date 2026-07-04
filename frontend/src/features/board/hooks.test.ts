// 보드 낙관적 reducer(moveCard) 단위 테스트 — DnD 드롭 시 캐시 변형 로직(T1-5 UI FSM).
// CR-039: 응답이 groups[](스프린트별)로 바뀌어 그룹 내 컬럼 기준으로 이동한다.
import { describe, expect, it } from 'vitest';
import { moveCard } from './hooks';
import type { BoardResponse, BoardColumn } from './api';
import type { WorkItemResponse } from '@/types/domain';

function card(id: number, statusId: number, over: Partial<WorkItemResponse> = {}): WorkItemResponse {
  return {
    id, key: `WMP-${id}`, projectId: 1, issueType: 'TASK', title: `t${id}`,
    commonStatus: 'TODO', priority: 'MEDIUM', statusId, progress: 0, ...over,
  };
}

function cols(todoCards: WorkItemResponse[]): BoardColumn[] {
  return [
    { statusId: 100, code: 'TODO', label: '할 일', commonStatus: 'TODO', isDone: false, isApproval: false, cards: todoCards },
    { statusId: 200, code: 'INP', label: '진행', commonStatus: 'IN_PROGRESS', isDone: false, isApproval: false, cards: [] },
  ];
}

// 단일 그룹(운영형/스크럼 미시작) 보드.
function board(): BoardResponse {
  return {
    projectId: 1, workflowId: 10,
    groups: [{ sprintId: null, sprintName: null, startDate: null, endDate: null, columns: cols([card(1, 100), card(2, 100)]) }],
  };
}

// 그룹0에서 컬럼 찾기 헬퍼.
const g0 = (b: BoardResponse) => b.groups[0].columns;

describe('moveCard (보드 낙관적 이동)', () => {
  it('카드를_다른컬럼으로_이동하면_출발컬럼에서빠지고_도착컬럼에추가', () => {
    const next = moveCard(board(), 1, 200);
    const todo = g0(next).find((c) => c.statusId === 100)!;
    const inp = g0(next).find((c) => c.statusId === 200)!;
    expect(todo.cards.map((c) => c.id)).toEqual([2]);
    expect(inp.cards.map((c) => c.id)).toEqual([1]);
  });

  it('도착컬럼_commonStatus를_카드에반영', () => {
    const next = moveCard(board(), 1, 200);
    const moved = g0(next).flatMap((c) => c.cards).find((c) => c.id === 1)!;
    expect(moved.statusId).toBe(200);
    expect(moved.commonStatus).toBe('IN_PROGRESS');
  });

  // CR-040: 막힘은 상태와 독립(flagged 깃발). 상태 전이(컬럼 이동)해도 flagged/blockReason은 그대로 유지.
  it('막힘카드_컬럼이동해도_flagged와blockReason유지', () => {
    const start = board();
    start.groups[0].columns[0].cards[0] = card(1, 100, { flagged: true, blockReason: '외부 승인 대기' });
    const next = moveCard(start, 1, 200);
    const moved = g0(next).flatMap((c) => c.cards).find((c) => c.id === 1)!;
    expect(moved.statusId).toBe(200);
    expect(moved.commonStatus).toBe('IN_PROGRESS');
    expect(moved.flagged).toBe(true);
    expect(moved.blockReason).toBe('외부 승인 대기');
  });

  it('없는카드_내용변화없음', () => {
    const b = board();
    const next = moveCard(b, 999, 200);
    expect(next.groups[0].columns.map((c) => c.cards.map((x) => x.id))).toEqual(
      b.groups[0].columns.map((c) => c.cards.map((x) => x.id)),
    );
  });

  it('없는컬럼_내용변화없음', () => {
    const b = board();
    const next = moveCard(b, 1, 777);
    expect(next.groups[0].columns.map((c) => c.cards.map((x) => x.id))).toEqual(
      b.groups[0].columns.map((c) => c.cards.map((x) => x.id)),
    );
  });

  // CR-039: 병렬 스프린트 — 같은 workItemId가 여러 그룹에 나타날 순 없지만, statusId는 그룹 간 동일하다.
  // 이동은 카드가 실제 속한 그룹만 변형하고 다른 스프린트 섹션은 그대로여야 한다.
  it('병렬그룹_카드있는그룹만이동하고_다른섹션은불변', () => {
    const b: BoardResponse = {
      projectId: 1, workflowId: 10,
      groups: [
        { sprintId: 7, sprintName: 'A', startDate: null, endDate: null, columns: cols([card(1, 100)]) },
        { sprintId: 8, sprintName: 'B', startDate: null, endDate: null, columns: cols([card(2, 100)]) },
      ],
    };
    const next = moveCard(b, 1, 200); // 카드1은 그룹 A 소속

    const aTodo = next.groups[0].columns.find((c) => c.statusId === 100)!;
    const aInp = next.groups[0].columns.find((c) => c.statusId === 200)!;
    expect(aTodo.cards.map((c) => c.id)).toEqual([]);
    expect(aInp.cards.map((c) => c.id)).toEqual([1]);

    // 그룹 B는 카드2가 TODO에 그대로(오염 없음).
    const bTodo = next.groups[1].columns.find((c) => c.statusId === 100)!;
    const bInp = next.groups[1].columns.find((c) => c.statusId === 200)!;
    expect(bTodo.cards.map((c) => c.id)).toEqual([2]);
    expect(bInp.cards.map((c) => c.id)).toEqual([]);
  });
});
