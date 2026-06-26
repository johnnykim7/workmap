// P2 API 계약(경로·메서드·바디) 단위 테스트 — 번다운/벨로시티·현장검증·저장필터·양식.
// MSW 대신 fetch 스텁으로 요청 URL/메서드/바디가 BE 컨트롤러 계약과 일치하는지 검증(DOM 무의존).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { burndownApi } from '@/features/burndown/api';
import { opsApi } from '@/features/ops/api';
import { savedFilterApi } from './api';
import { adminApi } from '@/features/admin/api';
import { workItemApi } from '@/features/workitem/api';
import { useAuthStore } from '@/store/auth-store';

interface Captured { url: string; method: string; body: unknown }
let captured: Captured[];

function ok<T>(data: T) {
  return { ok: true, status: 200, json: async () => ({ success: true, data, error: null }) } as Response;
}

beforeEach(() => {
  captured = [];
  useAuthStore.getState().setSession({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user: { id: 1, name: 'u', email: 'a@b.com', role: 'ADMIN' } as any,
    accessToken: 't', refreshToken: 'r',
  });
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    captured.push({
      url: String(input),
      method: init?.method ?? 'GET',
      body: init?.body ? JSON.parse(init.body as string) : undefined,
    });
    return ok({});
  }));
});
afterEach(() => { vi.unstubAllGlobals(); useAuthStore.getState().clear(); });

const last = () => captured[captured.length - 1];

describe('P2 API 계약', () => {
  it('번다운_스프린트경로_GET', async () => {
    await burndownApi.burndown(42);
    expect(last().method).toBe('GET');
    expect(last().url).toMatch(/\/sprints\/42\/burndown$/);
  });

  it('벨로시티_프로젝트경로_GET', async () => {
    await burndownApi.velocity(7);
    expect(last().url).toMatch(/\/projects\/7\/velocity$/);
  });

  it('현장검증_목록_GET_work-items중첩경로', async () => {
    await opsApi.listVerifications(99);
    expect(last().method).toBe('GET');
    expect(last().url).toMatch(/\/work-items\/99\/field-verifications$/);
  });

  it('현장검증_생성_POST_result·createFollowUp바디', async () => {
    await opsApi.createVerification(99, {
      verifier: '홍길동', verifiedDate: '2026-06-27', result: 'FAIL',
      issuesFound: '버튼 미동작', createFollowUp: true,
    });
    expect(last().method).toBe('POST');
    expect(last().url).toMatch(/\/work-items\/99\/field-verifications$/);
    expect(last().body).toMatchObject({ result: 'FAIL', createFollowUp: true });
  });

  it('저장필터_생성_POST_query는JSON문자열', async () => {
    const query = JSON.stringify({ keyword: '결제', quick: ['blocked'] });
    await savedFilterApi.create({ name: '내 막힌 결제', query, shared: false });
    expect(last().method).toBe('POST');
    expect(last().url).toMatch(/\/saved-filters$/);
    expect(last().body).toMatchObject({ name: '내 막힌 결제', shared: false });
    expect(typeof (last().body as { query: unknown }).query).toBe('string');
  });

  it('저장필터_삭제_DELETE_id경로', async () => {
    await savedFilterApi.remove(3);
    expect(last().method).toBe('DELETE');
    expect(last().url).toMatch(/\/saved-filters\/3$/);
  });

  it('양식_제출_POST_title바디_중첩경로', async () => {
    await adminApi.forms.submit(8, { title: '신규 버그', description: 'x' });
    expect(last().method).toBe('POST');
    expect(last().url).toMatch(/\/admin\/forms\/8\/submit$/);
    expect(last().body).toMatchObject({ title: '신규 버그' });
  });

  it('양식_목록_projectId쿼리', async () => {
    await adminApi.forms.list(5);
    expect(last().url).toContain('/admin/forms?');
    expect(last().url).toContain('projectId=5');
  });

  it('업무유형_생성_POST_code·depth바디', async () => {
    await adminApi.issueTypes.create({ code: 'INCIDENT', label: '장애', depth: 1 });
    expect(last().method).toBe('POST');
    expect(last().url).toMatch(/\/admin\/issue-types$/);
    expect(last().body).toMatchObject({ code: 'INCIDENT', depth: 1 });
  });

  it('업무유형_수정_PUT_id경로', async () => {
    await adminApi.issueTypes.update(4, { code: 'INCIDENT', label: '장애', depth: 1 });
    expect(last().method).toBe('PUT');
    expect(last().url).toMatch(/\/admin\/issue-types\/4$/);
  });

  it('처리량_GET_from·to쿼리', async () => {
    await opsApi.throughput(7, '2026-06-01', '2026-06-27');
    expect(last().method).toBe('GET');
    expect(last().url).toContain('/projects/7/throughput?');
    expect(last().url).toContain('from=2026-06-01');
    expect(last().url).toContain('to=2026-06-27');
  });

  it('처리량_기간미지정_쿼리없음', async () => {
    await opsApi.throughput(7);
    expect(last().url).toMatch(/\/projects\/7\/throughput$/);
  });

  it('백로그전환_POST_targetProject·issueType바디', async () => {
    await opsApi.promoteToBacklog(50, { targetProjectId: 9, issueType: 'STORY', title: 'x' });
    expect(last().method).toBe('POST');
    expect(last().url).toMatch(/\/work-items\/50\/promote-to-backlog$/);
    expect(last().body).toMatchObject({ targetProjectId: 9, issueType: 'STORY' });
  });

  it('첨부_목록_GET_work-items중첩경로', async () => {
    await workItemApi.listAttachments(12);
    expect(last().method).toBe('GET');
    expect(last().url).toMatch(/\/work-items\/12\/attachments$/);
  });

  it('첨부_생성_POST_fileName·filePath바디', async () => {
    await workItemApi.createAttachment(12, { fileName: '설계도.pdf', filePath: 'https://x/a.pdf' });
    expect(last().method).toBe('POST');
    expect(last().url).toMatch(/\/work-items\/12\/attachments$/);
    expect(last().body).toMatchObject({ fileName: '설계도.pdf', filePath: 'https://x/a.pdf' });
  });

  it('유형전환_PATCH_issueType바디', async () => {
    await workItemApi.convert(33, { issueType: 'STORY', epicId: 5 });
    expect(last().method).toBe('PATCH');
    expect(last().url).toMatch(/\/work-items\/33\/convert$/);
    expect(last().body).toMatchObject({ issueType: 'STORY', epicId: 5 });
  });
});
