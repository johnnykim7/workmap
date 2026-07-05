// 사용자 관리 API (T3-2 B, WMP-AUTH-004/005) — UserController 계약. 생성/수정/비활성화 Admin 전용.
import { api, type PageResponse } from '@/lib/api-client';
import type { User, UserDetail, UserRole } from '@/types/domain';

export interface CreateUserRequest {
  email: string;
  password: string;          // 8~72자
  name: string;
  role?: UserRole | null;
  departmentId?: number | null;
}
export interface UpdateUserRequest {
  name?: string | null;
  role?: UserRole | null;
  departmentId?: number | null;
}

export const userApi = {
  search: (keyword: string, page = 0, size = 20) => {
    const p = new URLSearchParams({ page: String(page), size: String(size) });
    if (keyword.trim()) p.set('keyword', keyword.trim());
    return api.get<PageResponse<User>>(`/users?${p.toString()}`);
  },
  create: (body: CreateUserRequest) => api.post<User>('/users', body),
  update: (id: number, body: UpdateUserRequest) => api.patch<User>(`/users/${id}`, body),
  deactivate: (id: number) => api.patch<void>(`/users/${id}/deactivate`),
  // CR-047 — 프로필 카드용 단건 상세, 본인 프로필 사진 저장(null=제거)
  getDetail: (id: number) => api.get<UserDetail>(`/users/${id}`),
  updateMyAvatar: (avatarUrl: string | null) => api.patch<User>('/users/me/avatar', { avatarUrl }),
};
