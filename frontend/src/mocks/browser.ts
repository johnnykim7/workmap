// MSW 브라우저 워커 — dev 모드에서만 기동(main.tsx에서 import.meta.env.DEV 가드).
// BE 완성 시: main.tsx의 enableMocking 호출 제거 + mocks/ 삭제하면 실 BE로 전환.
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
