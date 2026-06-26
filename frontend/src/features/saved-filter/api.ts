// 저장 필터 API (WMP-VIEW-004, CR-012) — SavedFilterController 계약. query는 JSON 문자열 패스스루.
// 수정·삭제는 소유자만(BE 가드). 목록은 내 것 + 공유받은 것.
import { api } from '@/lib/api-client';

export interface SavedFilterResponse {
  id: number;
  ownerId: number;
  name: string;
  query: string;     // 목록 필터 조건 JSON 문자열
  shared: boolean;
  mine: boolean;     // 뷰어가 소유자인지(공유받은 것과 구분)
  createdAt: string;
}
export interface SavedFilterRequest {
  name: string;
  query: string;
  shared: boolean;
}

export const savedFilterApi = {
  list: () => api.get<SavedFilterResponse[]>('/saved-filters'),
  create: (body: SavedFilterRequest) => api.post<SavedFilterResponse>('/saved-filters', body),
  update: (id: number, body: SavedFilterRequest) =>
    api.put<SavedFilterResponse>(`/saved-filters/${id}`, body),
  remove: (id: number) => api.delete<void>(`/saved-filters/${id}`),
};
