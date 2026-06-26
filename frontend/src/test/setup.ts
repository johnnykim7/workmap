// vitest 전역 셋업 — MSW 서버 + jest-dom matcher.
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from '@/mocks/server';
import { __resetMockState } from '@/mocks/handlers';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  __resetMockState();
});
afterAll(() => server.close());
