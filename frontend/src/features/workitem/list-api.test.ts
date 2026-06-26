// 통합 목록 쿼리스트링 빌더 단위테스트 — 빈 필터 생략 + 기본 page/size + BE 필드명 일치.
import { describe, it, expect } from 'vitest';
import { toQuery, type WorkItemListParams } from './list-api';

function parse(qs: string) {
  return Object.fromEntries(new URLSearchParams(qs));
}

describe('toQuery — 통합 목록 검색 파라미터', () => {
  it('빈필터_projectId와기본페이징만', () => {
    const q = parse(toQuery({ projectId: 7 }));
    expect(q).toEqual({ projectId: '7', page: '0', size: '20' });
  });

  it('필터지정_BE필드명으로직렬화', () => {
    const params: WorkItemListParams = {
      projectId: 7, issueType: 'BUG', commonStatus: 'IN_PROGRESS', priority: 'HIGH',
      assigneeId: 3, sprintId: 9, keyword: '  결제  ', sort: 'dueDate', direction: 'ASC',
      page: 2, size: 50,
    };
    const q = parse(toQuery(params));
    expect(q).toMatchObject({
      projectId: '7', issueType: 'BUG', commonStatus: 'IN_PROGRESS', priority: 'HIGH',
      assigneeId: '3', sprintId: '9', keyword: '결제', sort: 'dueDate', direction: 'ASC',
      page: '2', size: '50',
    });
  });

  it('빈키워드_생략', () => {
    const q = parse(toQuery({ projectId: 1, keyword: '   ' }));
    expect(q.keyword).toBeUndefined();
  });

  it('assigneeId_0도_포함(falsy주의)', () => {
    // 시스템 계정 id=0 같은 경우라도 != null 기준이면 포함돼야 한다
    const q = parse(toQuery({ projectId: 1, assigneeId: 0 }));
    expect(q.assigneeId).toBe('0');
  });
});
