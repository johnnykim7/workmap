// 저장 필터 훅 (WMP-VIEW-004) — 목록 + 생성/수정/삭제(소유자만). 토스트 + 캐시 무효화.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@therecommerce/ds-ui';
import { ApiError } from '@/lib/api-client';
import { savedFilterApi, type SavedFilterRequest } from './api';

const msg = (e: unknown, fb: string) => (e instanceof ApiError ? e.message : fb);

export function useSavedFilters() {
  return useQuery({
    queryKey: ['saved-filters'],
    queryFn: () => savedFilterApi.list(),
  });
}

export function useSavedFilterMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['saved-filters'] });

  const create = useMutation({
    mutationFn: (body: SavedFilterRequest) => savedFilterApi.create(body),
    onSuccess: () => { invalidate(); toast.success('필터를 저장했습니다.'); },
    onError: (e) => toast.error(msg(e, '필터 저장에 실패했습니다.')),
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: SavedFilterRequest }) =>
      savedFilterApi.update(id, body),
    onSuccess: () => { invalidate(); toast.success('필터를 수정했습니다.'); },
    onError: (e) => toast.error(msg(e, '필터 수정에 실패했습니다.')),
  });
  const remove = useMutation({
    mutationFn: (id: number) => savedFilterApi.remove(id),
    onSuccess: () => { invalidate(); toast.success('필터를 삭제했습니다.'); },
    onError: (e) => toast.error(msg(e, '필터 삭제에 실패했습니다.')),
  });
  return { create, update, remove };
}
