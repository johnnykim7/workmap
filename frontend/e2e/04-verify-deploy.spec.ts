import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { loginAsAdmin, enterWorkspace, selectByLabel } from './helpers';

// 배포 검증: ① LNB 생존(tiptap 트랩 재발 여부) ② DOC 유형이 만들기 모달에 노출 ③ 첨부=파일 업로드 버전.
const st = () => JSON.parse(fs.readFileSync('e2e/.state.json', 'utf-8'));
const FIX = (n: string) => path.resolve('e2e/fixtures', n);

test('① LNB 생존 확인 (tiptap 트랩 재발 없음)', async ({ page }) => {
  await loginAsAdmin(page);
  await enterWorkspace(page, '반품구조대');
  await page.goto('/');
  await page.waitForTimeout(1500);
  // 데스크탑(1440)에서 LNB 항목이 실제로 보여야 함(link/button 무관하게 텍스트 가시성으로 확인).
  // tiptap 트랩이 재발하면 사이드바 전체가 display:none이라 이 텍스트들이 사라진다.
  for (const name of ['대시보드', '알림', '검색', '워크룸', '설정']) {
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  }
  console.log('LNB 생존 OK — 대시보드/알림/검색/워크룸/설정 표시됨(tiptap 트랩 재발 없음)');
});

test('② DOC 유형이 만들기 모달에 노출', async ({ page }) => {
  await loginAsAdmin(page);
  await enterWorkspace(page, '반품구조대');
  await page.goto(`/projects/${st().projectKey}`);
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: '만들기', exact: true }).click();
  const d = page.getByRole('dialog');
  await expect(d.getByRole('heading', { name: /만들기/ })).toBeVisible();
  // 유형 Select(combobox 1) 열기 → Doc 옵션 존재 확인
  await d.getByRole('combobox').nth(1).click();
  await page.waitForTimeout(400);
  await expect(page.getByRole('option', { name: 'Doc', exact: true })).toBeVisible();
  console.log('DOC 유형 노출 OK — 만들기 모달 유형 목록에 Doc 있음');
});

test('③ DOC 유형으로 실제 업무 생성', async ({ page }) => {
  await loginAsAdmin(page);
  await enterWorkspace(page, '반품구조대');
  await page.goto(`/projects/${st().projectKey}`);
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: '만들기', exact: true }).click();
  const d = page.getByRole('dialog');
  await selectByLabel(page, d.getByRole('combobox').nth(1), 'Doc');
  await d.getByPlaceholder('무엇을 할 일인가요?').fill('[DOC] 카페24 연동 아키텍처 문서 (실 DOC 유형)');
  const [resp] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/work-items') && r.request().method() === 'POST', { timeout: 20_000 }),
    d.getByRole('button', { name: '만들기', exact: true }).click(),
  ]);
  const body = await resp.json();
  expect(resp.ok(), `DOC 생성 실패: ${resp.status()} ${JSON.stringify(body?.error)}`).toBeTruthy();
  expect(body?.data?.issueType).toBe('DOC');
  console.log(`DOC 업무 생성 OK → ${body?.data?.key} (issueType=DOC)`);
});

test('④ 첨부 = 파일 업로드 버전 배포 확인', async ({ page }) => {
  await loginAsAdmin(page);
  await enterWorkspace(page, '반품구조대');
  const all = st().allKeys as Record<string, string>;
  const key = all['[문서] 카페24 OAuth 연동 규격서'];
  await page.goto(`/work-items/${key}`);
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: /첨부 추가/ }).click();
  const dlg = page.getByRole('dialog');
  await expect(dlg.getByText('첨부 추가')).toBeVisible();
  // 파일 업로드 버전이면 <input type=file> 존재, URL 버전이면 텍스트 입력만
  const fileInput = dlg.locator('input[type="file"]');
  const isUpload = (await fileInput.count()) > 0;
  console.log(`첨부 다이얼로그 타입: ${isUpload ? '파일 업로드(WMP-WI-012 배포됨)' : 'URL 수동입력(구버전)'}`);
  if (isUpload) {
    await fileInput.first().setInputFiles(FIX('cafe24-oauth-spec.png'));
    await page.waitForTimeout(300);
    const [resp] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/files/upload'), { timeout: 20_000 }),
      dlg.getByRole('button', { name: '추가', exact: true }).click(),
    ]);
    expect(resp.ok()).toBeTruthy();
    console.log('실제 파일 업로드 성공 — WMP-WI-012 배포 확인');
  }
  expect(isUpload, '첨부가 파일 업로드 버전으로 배포되어야 함').toBeTruthy();
});
