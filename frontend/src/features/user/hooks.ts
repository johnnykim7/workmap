// 사용자 관리 훅 (WMP-AUTH-004/005) — 목록/생성/수정/비활성화. 토스트 + 캐시 무효화.
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from '@therecommerce/ds-ui';
import { ApiError } from '@/lib/api-client';
import { userApi, type CreateUserRequest, type UpdateUserRequest } from './api';

const msg = (e: unknown, fb: string) => (e instanceof ApiError ? e.message : fb);

export function useUsers(keyword: string, page = 0, size = 20) {
  return useQuery({
    queryKey: ['users', 'admin', keyword, page],
    queryFn: () => userApi.search(keyword, page, size),
    placeholderData: keepPreviousData,
  });
}

export function useUserMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] });

  const create = useMutation({
    mutationFn: (body: CreateUserRequest) => userApi.create(body),
    onSuccess: () => { invalidate(); toast.success('사용자를 생성했습니다.'); },
    onError: (e) => toast.error(msg(e, '생성에 실패했습니다.')),
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateUserRequest }) => userApi.update(id, body),
    onSuccess: () => { invalidate(); toast.success('사용자를 수정했습니다.'); },
    onError: (e) => toast.error(msg(e, '수정에 실패했습니다.')),
  });
  const deactivate = useMutation({
    mutationFn: (id: number) => userApi.deactivate(id),
    onSuccess: () => { invalidate(); toast.success('사용자를 비활성화했습니다.'); },
    onError: (e) => toast.error(msg(e, '비활성화에 실패했습니다.')),
  });
  return { create, update, deactivate };
}
