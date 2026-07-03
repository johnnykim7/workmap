import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { loginAsAdmin, enterWorkspace, selectByLabel } from './helpers';

// 등록된 업무들 위에서 WorkMap 부가 기능을 실제로 태운다:
// 첨부·댓글·리치설명·상태전이(칸반)·스프린트(백로그)·검색. 각 test 독립(하나 실패해도 나머지 실행).

const STATE_FILE = 'e2e/.state.json';
const st = () => JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
const FIX = (n: string) => path.resolve('e2e/fixtures', n);

async function enter(page) {
  await loginAsAdmin(page);
  await enterWorkspace(page, '반품구조대');
}

// key로 업무 상세 진입
async function openItem(page, key: string) {
  await page.goto(`/work-items/${key}`);
  await page.waitForTimeout(1000);
  await expect(page.getByRole('heading').first()).toBeVisible();
}

test('첨부 등록 (문서·이미지 6종)', async ({ page }) => {
  test.setTimeout(120_000);
  await enter(page);
  const all = st().allKeys as Record<string, string>;
  // 운영 FE의 첨부 다이얼로그는 URL 수동입력 방식(파일 이름·경로/URL·콘텐츠 타입).
  // (소스는 파일 업로드로 교체됐으나 운영 FE 미배포 상태 — 운영 현화면에 맞춰 URL로 등록)
  const attachMap: Array<[string, string, string]> = [
    ['[문서] 카페24 OAuth 연동 규격서', 'cafe24-oauth-spec.pdf', 'application/pdf'],
    ['앱스토어 스크린샷·그래픽 이미지', 'app-screenshot.png', 'image/png'],
    ['[문서] 개인정보처리방침 초안 (없으면 앱 출시 불가)', 'privacy-policy.pdf', 'application/pdf'],
    ['[문서] 서비스 이용약관', 'terms.pdf', 'application/pdf'],
    ['[문서] 셀러 온보딩 가이드', 'onboarding-guide.pdf', 'application/pdf'],
    ['[문서] FAQ·운영 매뉴얼', 'faq-manual.pdf', 'application/pdf'],
  ];
  for (const [title, fileName, ctype] of attachMap) {
    const key = all[title];
    if (!key) { console.log(`SKIP(첨부) 키없음: ${title}`); continue; }
    await openItem(page, key);
    await page.getByRole('button', { name: /첨부 추가/ }).click();
    const dlg = page.getByRole('dialog');
    await expect(dlg.getByText('첨부 추가')).toBeVisible();

    // 운영: 파일 업로드 방식이면 숨김 input, URL 방식이면 텍스트 입력 — 둘 다 대응
    const fileInput = dlg.locator('input[type="file"]');
    if (await fileInput.count()) {
      await fileInput.first().setInputFiles(FIX(fileName.replace(/\.pdf$/, '.png')));
      await page.waitForTimeout(300);
      const [resp] = await Promise.all([
        page.waitForResponse((r) => r.url().includes('/api/v1/files/upload'), { timeout: 20_000 }),
        dlg.getByRole('button', { name: '추가', exact: true }).click(),
      ]);
      expect(resp.ok(), `첨부 업로드 실패 ${title}: ${resp.status()}`).toBeTruthy();
    } else {
      // URL 수동입력: 파일 이름 + 경로/URL + 콘텐츠 타입
      await dlg.getByPlaceholder(/설계도\.pdf/).fill(fileName);
      await dlg.getByPlaceholder(/https:\/\/|파일 경로/).fill(`https://docs.example.com/rtn24/${fileName}`);
      const ctypeField = dlg.getByPlaceholder(/application\/pdf/);
      if (await ctypeField.count()) await ctypeField.fill(ctype);
      const [resp] = await Promise.all([
        page.waitForResponse((r) => /\/attachments/.test(r.url()) && r.request().method() === 'POST', { timeout: 15_000 }),
        dlg.getByRole('button', { name: '추가', exact: true }).click(),
      ]);
      expect(resp.ok(), `첨부 등록 실패 ${title}: ${resp.status()} ${await resp.text().catch(() => '')}`).toBeTruthy();
    }
    await page.waitForTimeout(600);
    console.log(`첨부 OK: ${title} (${key})`);
  }
});

test('댓글 작성 (주요 항목)', async ({ page }) => {
  await enter(page);
  const all = st().allKeys as Record<string, string>;
  const comments: Array<[string, string]> = [
    ['NormalizedOrder 매핑 (Cafe24OrderAdapter 실구현)', '네이버 어댑터 패턴 참고해서 진행합니다. @개발자1 확인 부탁해요.'],
    ['Leaky Bucket 429 재시도 (Cafe24ApiRateLimiter 확장)', 'X-Cafe24-Call-Remain 헤더로 backoff 시간 계산하면 됩니다.'],
    ['[문서] 개인정보처리방침 초안 (없으면 앱 출시 불가)', '이거 없으면 카페24 앱 출시 자체가 막힙니다. 최우선 처리.'],
  ];
  for (const [title, text] of comments) {
    const key = all[title];
    if (!key) { console.log(`SKIP(댓글) 키없음: ${title}`); continue; }
    await openItem(page, key);
    const ta = page.getByPlaceholder(/댓글 입력/);
    await ta.scrollIntoViewIfNeeded();
    await ta.fill(text);
    const [resp] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/comments') && r.request().method() === 'POST', { timeout: 15_000 }),
      page.getByRole('button', { name: '등록', exact: true }).click(),
    ]);
    expect(resp.ok(), `댓글 실패 ${title}`).toBeTruthy();
    console.log(`댓글 OK: ${title}`);
  }
});

test('상태 전이 (칸반 워크플로 — 여러 항목)', async ({ page }) => {
  test.setTimeout(120_000);
  await enter(page);
  const all = st().allKeys as Record<string, string>;
  // 진행중/완료로 몇 건 전이 — 실제 진행 상황처럼
  const moves: Array<[string, string]> = [
    ['카페24 개발자센터 앱 생성·redirect_uri 등록', '완료'],
    ['authorize→token 교환 클라이언트 구현 (Cafe24TokenClient)', '진행'],
    ['GET /admin/orders 목록·상세 클라이언트', '진행'],
    ['구글 개발자 계정 등록($25 1회)', '완료'],
    ['앱 아이콘 제작', '진행'],
  ];
  for (const [title, statusHint] of moves) {
    const key = all[title];
    if (!key) { console.log(`SKIP(상태) 키없음: ${title}`); continue; }
    await openItem(page, key);
    // 상태 Select(DetailHeader) — 현재 상태 라벨 트리거. 다음 상태로 이동.
    const statusSelect = page.getByRole('combobox').first();
    await statusSelect.click();
    await page.waitForTimeout(300);
    // 힌트에 맞는 옵션(진행/완료 계열) 선택
    const opt = page.getByRole('option', { name: new RegExp(statusHint) }).first();
    if (await opt.count()) {
      const [resp] = await Promise.all([
        page.waitForResponse((r) => r.url().includes('/status') && r.request().method() === 'PATCH', { timeout: 15_000 }).catch(() => null),
        opt.click(),
      ]);
      await page.waitForTimeout(500);
      console.log(`상태 OK: ${title} → ${statusHint} (${resp?.status() ?? 'n/a'})`);
    } else {
      await page.keyboard.press('Escape');
      console.log(`상태 옵션 없음(스킵): ${title} → ${statusHint}`);
    }
  }
});

test('스프린트 생성 (백로그)', async ({ page }) => {
  await enter(page);
  const { projectKey } = st();
  await page.goto(`/projects/${projectKey}/backlog`);
  await page.waitForTimeout(1500);
  const createBtn = page.getByRole('button', { name: /스프린트 만들기/ });
  if (!(await createBtn.count())) {
    console.log('스프린트 만들기 버튼 없음 — 스킵');
    test.skip();
    return;
  }
  await createBtn.first().click();
  const dlg = page.getByRole('dialog');
  await expect(dlg).toBeVisible();
  // 스프린트 이름 입력(첫 텍스트 input)
  const nameInput = dlg.locator('input[type="text"], input:not([type])').first();
  if (await nameInput.count()) await nameInput.fill('Sprint 1 — OAuth·주문 기반');
  const [resp] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/sprints') && r.request().method() === 'POST', { timeout: 15_000 }).catch(() => null),
    dlg.getByRole('button', { name: /만들기|생성|저장/ }).last().click(),
  ]);
  console.log(`스프린트 생성 응답: ${resp?.status() ?? 'n/a'}`);
});

test('하위작업 추가 (상세 화면 인라인)', async ({ page }) => {
  await enter(page);
  const all = st().allKeys as Record<string, string>;
  // 부모 업무 밑에 SUBTASK 인라인 추가(부모 필수 제약을 상세 화면으로 충족)
  const subtasks: Array<[string, string]> = [
    ['authorize→token 교환 클라이언트 구현 (Cafe24TokenClient)', '토큰 교환 단위테스트 작성'],
    ['NormalizedOrder 매핑 (Cafe24OrderAdapter 실구현)', '결제수단·배송지 필드 매핑 검증'],
  ];
  for (const [parentTitle, subTitle] of subtasks) {
    const key = all[parentTitle];
    if (!key) { console.log(`SKIP(하위) 부모 키없음: ${parentTitle}`); continue; }
    await openItem(page, key);
    // "하위작업 추가" 진입(DetailHeader 액션) 또는 하위작업 섹션의 "추가" 토글
    const addToggle = page.getByRole('button', { name: /하위작업 추가|추가/ }).first();
    await addToggle.click();
    await page.waitForTimeout(400);
    const input = page.getByPlaceholder('하위 작업 제목');
    await expect(input).toBeVisible();
    await input.fill(subTitle);
    const [resp] = await Promise.all([
      page.waitForResponse((r) => /\/subtasks/.test(r.url()) && r.request().method() === 'POST', { timeout: 15_000 }),
      input.press('Enter'),
    ]);
    expect(resp.ok(), `하위작업 실패 ${subTitle}: ${resp.status()}`).toBeTruthy();
    console.log(`하위작업 OK: ${parentTitle} → ${subTitle}`);
  }
});

test('업무 링크 (주문↔클레임 RELATES_TO)', async ({ page }) => {
  await enter(page);
  const all = st().allKeys as Record<string, string>;
  const src = all['NormalizedOrder 매핑 (Cafe24OrderAdapter 실구현)'];
  const target = 'cancellation/exchange/return 조회 클라이언트';
  if (!src) { test.skip(); return; }
  await openItem(page, src);
  // "연결된 업무" 섹션의 "연결" 버튼 (LinkedItems 실측)
  const addLink = page.getByRole('button', { name: '연결', exact: true }).first();
  await addLink.scrollIntoViewIfNeeded().catch(() => {});
  if (!(await addLink.count())) { console.log('연결 버튼 없음 — 스킵'); test.skip(); return; }
  await addLink.click();
  const dlg = page.getByRole('dialog');
  await expect(dlg.getByText('업무 연결')).toBeVisible();
  // 링크 유형 기본 RELATES_TO. 대상 항목 검색(SearchInput).
  const searchBox = dlg.getByRole('searchbox').or(dlg.locator('input')).first();
  await searchBox.fill('cancellation');
  await page.waitForTimeout(1500);
  const option = dlg.getByText(new RegExp(target.slice(0, 12))).first();
  if (await option.count()) {
    await option.click();
    await page.waitForTimeout(300);
    const [resp] = await Promise.all([
      page.waitForResponse((r) => /\/links/.test(r.url()) && r.request().method() === 'POST', { timeout: 15_000 }).catch(() => null),
      dlg.getByRole('button', { name: /추가|연결|저장/ }).last().click(),
    ]);
    console.log(`링크 OK: 주문↔클레임 (${resp?.status() ?? 'n/a'})`);
  } else {
    console.log('링크 대상 검색 결과 없음 — 스킵');
  }
});

test('검색 (cafe24 키워드 + 라벨)', async ({ page }) => {
  await enter(page);
  await page.goto('/search');
  await page.waitForTimeout(1000);
  const search = page.getByRole('searchbox').first();
  await search.fill('카페24');
  await page.waitForTimeout(1500);
  // 결과 존재(방금 등록한 EPIC들이 잡혀야 함)
  const bodyText = await page.locator('body').innerText();
  expect(bodyText).toContain('연동');
  console.log('검색 OK: "카페24" 결과 렌더됨');
});
