// API 클라이언트 — bp-common-lib ResponseDto<T> 래퍼를 푸는 fetch 헬퍼.
// BE 포트 8186(전역 포트 레지스트리). Sprint2 인증 API부터 실제 사용.
import { useAuthStore } from '@/store/auth-store';

// T3-2 §API 기본 규격: Base URL = /api/v1. dev는 MSW가 /api/v1을 가로챈다.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

// bp-common-lib ResponseDto<T> 실 형태: { success, data, error?, timestamp }
// 성공: { success:true, data, error:null }. 실패: { success:false, data:null, error:{code,message} }
export interface ResponseDto<T> {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
  timestamp?: string;
}

// bp-common-lib PageResponse<T> 실 형태: { items, totalCount, page, pageSize, totalPages }
export interface PageResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  const body = (await res.json().catch(() => null)) as ResponseDto<T> | null;

  if (!res.ok || !body || body.success === false) {
    throw new ApiError(body?.error?.code ?? 'UNKNOWN', body?.error?.message ?? res.statusText, res.status);
  }
  return body.data;
}

// 멀티파트 업로드(CR-024). Content-Type을 직접 지정하지 않는다 — 브라우저가 boundary를 붙여야 함.
async function upload<T>(path: string, formData: FormData): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    body: formData,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const body = (await res.json().catch(() => null)) as ResponseDto<T> | null;
  if (!res.ok || !body || body.success === false) {
    throw new ApiError(body?.error?.code ?? 'UNKNOWN', body?.error?.message ?? res.statusText, res.status);
  }
  return body.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),
  upload,
};
