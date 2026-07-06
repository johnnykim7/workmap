// 결과 섹션 노출 게이트 단위테스트 (WMP-WI-017, CR-048) — 완료 상태(DONE·OPS_APPLIED)에서만 노출.
import { describe, it, expect } from 'vitest';
import { isDoneStatus } from './result-visibility';
import type { WorkItemResponse, WorkStatus } from '@/types/domain';

function wi(commonStatus: WorkStatus): WorkItemResponse {
  return {
    id: 1, key: 'ZGOH-1', projectId: 1, issueType: 'TASK', title: 't',
    commonStatus, priority: 'MEDIUM', progress: 0,
  } as WorkItemResponse;
}

describe('isDoneStatus — 완료 상태에서만 결과 섹션 노출', () => {
  it('DONE_노출', () => {
    expect(isDoneStatus(wi('DONE'))).toBe(true);
  });

  it('운영형_OPS_APPLIED_노출', () => {
    expect(isDoneStatus(wi('OPS_APPLIED'))).toBe(true);
  });

  it('TODO_미노출', () => {
    expect(isDoneStatus(wi('TODO'))).toBe(false);
  });

  it('IN_PROGRESS_미노출', () => {
    expect(isDoneStatus(wi('IN_PROGRESS'))).toBe(false);
  });

  it('개발완료(DEV_DONE)는_아직_완료아님_미노출', () => {
    // DEV_DONE은 STATUS_CATEGORY상 INPROGRESS(현장검증 남음) → 결과 섹션 미노출
    expect(isDoneStatus(wi('DEV_DONE'))).toBe(false);
  });
});
