// MSW Node 서버 — 단위테스트(vitest)에서 핸들러 사용.
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
