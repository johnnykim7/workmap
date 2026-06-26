// 워크스페이스 API (T3-2 §C). 목록은 List<Response>(배열).
// 프로젝트 템플릿은 BE 조회 엔드포인트가 없어 domain.ts 상수(PROJECT_TEMPLATES)를 사용한다.
import { api } from '@/lib/api-client';
import type { Workspace } from '@/types/domain';

export const workspaceApi = {
  list: () => api.get<Workspace[]>('/workspaces'),
};
