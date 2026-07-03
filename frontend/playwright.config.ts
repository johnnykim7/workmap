import { defineConfig, devices } from '@playwright/test';

// WorkMap 운영(59.8.160.12:3186) 대상 E2E — 카페24 연동 프로젝트 시딩 + 전체 기능 태우기.
// FE는 nginx가 3186에서 서빙, 같은 오리진 /api/v1이 8186 BE로 프록시된다(실측 확인).
export default defineConfig({
  testDir: './e2e',
  testIgnore: ['**/_probe*.ts'],
  // 시딩은 순서 의존(WS→프로젝트→EPIC→STORY...)이라 순차 실행. 병렬 금지.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e/report' }]],
  use: {
    baseURL: 'http://59.8.160.12:3186',
    viewport: { width: 1440, height: 900 }, // 데스크탑 고정(LNB hidden md:block 트랩 회피)
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
